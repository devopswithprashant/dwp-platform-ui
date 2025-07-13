import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateBlog = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newBlog = {
        ...formData,
        publishdate: new Date().toISOString(),
        lastupdatedate: new Date().toISOString()
      };
      
      await axios.post('http://localhost:9090/api/v1/blogs', newBlog);
      //await axios.post(`${process.env.REACT_APP_API_BASE_URL}/blogs`, newBlog);
      navigate('/blogs');
      window.location.reload(); // Refresh to show new blog
    } catch (error) {
      console.error('Error creating blog:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="mt-4">
      <h2>Create New Blog</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Title</label>
          <input
            type="text"
            className="form-control"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Content</label>
          <textarea
            className="form-control"
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows="6"
            required
          ></textarea>
        </div>

        <div className="mb-3">
          <label className="form-label">Author</label>
          <input
            type="text"
            className="form-control"
            name="author"
            value={formData.author}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Publish Blog
        </button>
      </form>
    </div>
  );
};

export default CreateBlog;