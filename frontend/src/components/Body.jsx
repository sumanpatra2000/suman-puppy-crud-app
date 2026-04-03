import { useEffect, useState } from "react";
import axios from "axios";
import { useAuthContext } from "@asgardeo/auth-react";
import "../styles/Body.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

function Body() {
  const { getAccessToken } = useAuthContext();

  const [puppies, setPuppies] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    name: "",
    age: "",
    breed: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    breed: "",
  });

  useEffect(() => {
    fetchPuppies();
  }, []);

  const getAuthConfig = async () => {
    const token = await getAccessToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const fetchPuppies = async () => {
    try {
      const config = await getAuthConfig();
      const res = await axios.get(`${API}/puppies`, config);
      setPuppies(res.data);
    } catch (err) {
      console.error("Error fetching puppies:", err);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const handleAddPuppy = async (e) => {
    e.preventDefault();

    try {
      const config = await getAuthConfig();
      await axios.post(`${API}/puppies`, formData, config);
      fetchPuppies();
      setFormData({ name: "", age: "", breed: "" });
    } catch (err) {
      console.error("Error adding puppy:", err);
    }
  };

  const handleEdit = (puppy) => {
    setEditingId(puppy.id);
    setEditData({
      name: puppy.name,
      age: puppy.age,
      breed: puppy.breed,
    });
  };

  const handleUpdate = async (id) => {
    try {
      const config = await getAuthConfig();
      await axios.put(`${API}/puppies/${id}`, editData, config);
      fetchPuppies();
      setEditingId(null);
      setEditData({ name: "", age: "", breed: "" });
    } catch (err) {
      console.error("Error updating puppy:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const config = await getAuthConfig();
      await axios.delete(`${API}/puppies/${id}`, config);
      fetchPuppies();
    } catch (err) {
      console.error("Error deleting puppy:", err);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({ name: "", age: "", breed: "" });
  };

  return (
    <div className="body-container">
      <div className="table-card">
        <h2 className="section-title">Puppies Table</h2>

        <table className="puppy-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Age</th>
              <th>Breed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {puppies.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>

                <td>
                  {editingId === p.id ? (
                    <input
                      className="table-input"
                      type="text"
                      name="name"
                      value={editData.name}
                      onChange={handleEditChange}
                    />
                  ) : (
                    p.name
                  )}
                </td>

                <td>
                  {editingId === p.id ? (
                    <input
                      className="table-input"
                      type="number"
                      name="age"
                      value={editData.age}
                      onChange={handleEditChange}
                    />
                  ) : (
                    p.age
                  )}
                </td>

                <td>
                  {editingId === p.id ? (
                    <input
                      className="table-input"
                      type="text"
                      name="breed"
                      value={editData.breed}
                      onChange={handleEditChange}
                    />
                  ) : (
                    p.breed
                  )}
                </td>

                <td>
                  <div className="action-buttons">
                    {editingId === p.id ? (
                      <>
                        <button
                          className="btn btn-save"
                          onClick={() => handleUpdate(p.id)}
                        >
                          Save
                        </button>
                        <button className="btn btn-cancel" onClick={handleCancel}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn btn-edit"
                          onClick={() => handleEdit(p)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-delete"
                          onClick={() => handleDelete(p.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="form-card">
        <h2 className="section-title">Add Puppy</h2>
        <form className="puppy-form" onSubmit={handleAddPuppy}>
          <input
            className="form-input"
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleFormChange}
          />
          <input
            className="form-input"
            type="number"
            name="age"
            placeholder="Age"
            value={formData.age}
            onChange={handleFormChange}
          />
          <input
            className="form-input"
            type="text"
            name="breed"
            placeholder="Breed"
            value={formData.breed}
            onChange={handleFormChange}
          />
          <button className="btn btn-add" type="submit">
            Add Puppy
          </button>
        </form>
      </div>
    </div>
  );
}

export default Body;