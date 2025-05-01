import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import PrettyTime from './PrettyTime';

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);

  const handleDelete = async () => {
    try {
      if (window.confirm('Are you sure you want to delete this blog?')) {
        await axios.delete(`http://3.83.102.231:9090/blog/${id}`);
        navigate('/blogs');
      }
    } catch (error) {
      console.error('Error deleting blog:', error);
    }
  };

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await axios.get(`http://3.83.102.231:9090/blogs/${id}`);
        setBlog(response.data);
      } catch (error) {
        console.error('Error fetching blog:', error);
      }
    };
    fetchBlog();
  }, [id]);

  if (!blog) 
    return (
      <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
      </div> );

  return (
    <div>
      <h2>{blog.title}</h2>
      {/* <p className="text-muted">
        author: {blog.author} | 
        Created: {new Date(blog.createDate).toLocaleString()} | 
        Last Modified: {new Date(blog.lastModifiedDate).toLocaleString()}
      </p> */}
      <p className="text-muted">
        {blog.author} | 
        Created: <PrettyTime timestamp={blog.publishdate} /> | 
        Last Modified: <PrettyTime timestamp={blog.lastupdatedate} /> 
      </p>
      <div className="card">
        <div className="card-body">
          <p className="card-text">{blog.content}</p>
        </div>
      </div>

      <div className="d-flex gap-2">
        <Link to={`/blogs/${id}/edit`} className="btn btn-primary mt-3">Edit</Link>
        <button className="btn btn-danger mt-3" onClick={handleDelete}>Delete</button>
      </div>
    </div>
  );
};

export default BlogDetail;