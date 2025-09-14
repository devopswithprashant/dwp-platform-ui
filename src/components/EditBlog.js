// components/EditBlog.js
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
//import apiClient from '../utils/apiClient';

const EditBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: ''
  });

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        //const response = await axios.get(`http://localhost:9090/api/v1/blogs/${id}`);
        const response = await axios.get(`/api/v1/blogs/${id}`);
        //const response = await apiClient.get(`/api/v1/blogs/${id}`);
        setFormData({
          title: response.data.title,
          content: response.data.content,
          author: response.data.author,
          publishdate: response.data.publishdate
        });
      } catch (error) {
        console.error('Error fetching blog:', error);
      }
    };
    fetchBlog();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedBlog = {
        ...formData,
        lastupdatedate: new Date().toISOString()
      };
      
      //await axios.put(`http://localhost:9090/api/v1/blog/${id}`, updatedBlog);
      await axios.put(`/api/v1/blog/${id}`, updatedBlog);
      //await apiClient.put(`/api/v1/blog/${id}`, updatedBlog);
      navigate(`/blogs/${id}`);
    } catch (error) {
      console.error('Error updating blog:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="mt-4">
      <h2>Edit Blog</h2>
      <form onSubmit={handleSubmit}>
        {/* Same form fields as CreateBlog */}
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
          Update Blog
        </button>
      </form>
    </div>
  );
};

export default EditBlog;