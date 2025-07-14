import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import About from './components/About';
// import TextForms from './components/TextForms';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Blogs from './components/Blogs';
import BlogDetail from './components/BlogDetail';
import CreateBlog from './components/CreateBlog';
import EditBlog from './components/EditBlog';
import Tester from './components/ApiTester';

function App() {
  return (
    <Router>
      <Navbar title="Devops with Prashant" sec1="Home" sec2="Blogs" sec3="Create"/>
      <div className="container my-3">
        <Routes>
          <Route exact path="/" element={<Home heading="Home Page of DevOps with Prashant Site"/>} />
          {/* <Route exact path="/" element={<Tester />} /> */}
          <Route exact path="/blogs" element={<Blogs />} />
          <Route path="/blogs/:id" element={<BlogDetail />} />
          <Route path="/create" element={<CreateBlog />} />
          <Route path="/blogs/:id/edit" element={<EditBlog />} />
          {/* <Route path="/tester" element={<Tester />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
