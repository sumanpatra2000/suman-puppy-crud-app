
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { Sequelize, DataTypes } from "sequelize";
import { createRemoteJWKSet, jwtVerify } from "jose";

const DB_SCHEMA = process.env.DB_SCHEMA || "app";
const useSsl = process.env.PGSSLMODE === "require";

const app = express();
app.use(cors());
app.use(express.json());

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: "postgres",
    dialectOptions: useSsl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : undefined,
    define: {
      schema: DB_SCHEMA,
    },
  }
);

const Puppies = sequelize.define(
  "puppies",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    breed: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    schema: DB_SCHEMA,
    tableName: "puppies",
    timestamps: false,
  }
);

const ASGARDEO_BASE_URL = process.env.ASGARDEO_BASE_URL;

if (!ASGARDEO_BASE_URL) {
  throw new Error("Missing ASGARDEO_BASE_URL in environment variables");
}

const JWKS = createRemoteJWKSet(
  new URL(`${ASGARDEO_BASE_URL}/oauth2/jwks`)
);

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.split(" ")[1];
    const { payload } = await jwtVerify(token, JWKS);

    req.userId = payload.sub;
    next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/puppies", authenticateToken, async (req, res) => {
  try {
    const puppies = await Puppies.findAll({
      where: { user_id: req.userId },
      order: [["id", "ASC"]],
    });

    res.json(puppies);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch puppies" });
  }
});

app.get("/puppies/:id", authenticateToken, async (req, res) => {
  try {
    const puppy = await Puppies.findOne({
      where: {
        id: req.params.id,
        user_id: req.userId,
      },
    });

    if (!puppy) {
      return res.status(404).json({ error: "Puppy not found" });
    }

    res.json(puppy);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch puppy" });
  }
});

app.post("/puppies", authenticateToken, async (req, res) => {
  try {
    const { name, age, breed } = req.body;

    if (!name || age === undefined || !breed) {
      return res
        .status(400)
        .json({ error: "name, age, and breed are required" });
    }

    const newPuppy = await Puppies.create({
      name,
      age,
      breed,
      user_id: req.userId,
    });

    res.status(201).json(newPuppy);
  } catch (err) {
    res.status(500).json({ error: "Failed to create puppy" });
  }
});

app.put("/puppies/:id", authenticateToken, async (req, res) => {
  try {
    const puppy = await Puppies.findOne({
      where: {
        id: req.params.id,
        user_id: req.userId,
      },
    });

    if (!puppy) {
      return res.status(404).json({ error: "Puppy not found" });
    }

    const { name, age, breed } = req.body;

    await puppy.update({
      name: name ?? puppy.name,
      age: age ?? puppy.age,
      breed: breed ?? puppy.breed,
    });

    res.json(puppy);
  } catch (err) {
    res.status(500).json({ error: "Failed to update puppy" });
  }
});

app.delete("/puppies/:id", authenticateToken, async (req, res) => {
  try {
    const puppy = await Puppies.findOne({
      where: {
        id: req.params.id,
        user_id: req.userId,
      },
    });

    if (!puppy) {
      return res.status(404).json({ error: "Puppy not found" });
    }

    await puppy.destroy();
    res.json({ message: "Puppy deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete puppy" });
  }
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected...");

    await Puppies.sync({ alter: true });
    console.log(`Puppies model synced in schema "${DB_SCHEMA}".`);

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
};

startServer();



