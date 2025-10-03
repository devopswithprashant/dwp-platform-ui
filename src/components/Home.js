//import React, {useState} from 'react'
import React from 'react'
import '../styles/Home.css';

const Home = (props) => {

    const handleDemoClick = () => {
    // You can replace this with actual navigation or modal opening
        alert('Schedule Demo functionality would go here');
    };


    const handleGetStarted = () => {
        // You can replace this with actual navigation
        alert('Get Started functionality would go here');
    };

    return (
  
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4">{props.heading}</h1>
              <p className="lead">Join thousands of developers learning CI/CD, Kubernetes, Cloud Infrastructure, and modern DevOps practices through our comprehensive tutorials and YouTube channel.</p>
              <div className="hero-buttons">
                <button className="btn btn-primary btn-lg me-3" onClick={handleGetStarted}>
                  Start Learning Free
                </button>
                <a href="https://youtube.com/your-channel" className="btn btn-outline-light btn-lg" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-youtube me-2"></i>Watch Videos
                </a>
              </div>
            </div>
            <div className="col-lg-6">
              <img src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="DevOps Learning" className="img-fluid rounded shadow" />
            </div>
          </div>
        </div>
      </section>

      {/* Learning Paths Section */}
      <section className="py-5">
        <div className="container">
          <h2 className="section-title">DevOps Learning Paths</h2>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-code-branch"></i>
                </div>
                <h4>CI/CD Fundamentals</h4>
                <p>Master Jenkins, GitLab CI, GitHub Actions and build robust deployment pipelines from scratch.</p>
                <div className="learning-stats">
                  <span className="badge bg-primary">15 Lessons</span>
                  <span className="badge bg-success">Beginner</span>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-ship"></i>
                </div>
                <h4>Containerization & Kubernetes</h4>
                <p>Learn Docker, container orchestration, and Kubernetes deployment strategies.</p>
                <div className="learning-stats">
                  <span className="badge bg-primary">22 Lessons</span>
                  <span className="badge bg-warning">Intermediate</span>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-cloud"></i>
                </div>
                <h4>Cloud Infrastructure</h4>
                <p>AWS, Azure, and GCP deployment with Infrastructure as Code using Terraform.</p>
                <div className="learning-stats">
                  <span className="badge bg-primary">18 Lessons</span>
                  <span className="badge bg-warning">Intermediate</span>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <h4>DevSecOps</h4>
                <p>Integrate security into your DevOps pipeline and learn best practices for secure deployments.</p>
                <div className="learning-stats">
                  <span className="badge bg-primary">12 Lessons</span>
                  <span className="badge bg-danger">Advanced</span>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-chart-line"></i>
                </div>
                <h4>Monitoring & Observability</h4>
                <p>Implement monitoring with Prometheus, Grafana, and logging with ELK stack.</p>
                <div className="learning-stats">
                  <span className="badge bg-primary">14 Lessons</span>
                  <span className="badge bg-warning">Intermediate</span>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-users"></i>
                </div>
                <h4>DevOps Culture & Practices</h4>
                <p>Learn team collaboration, agile methodologies, and DevOps best practices.</p>
                <div className="learning-stats">
                  <span className="badge bg-primary">10 Lessons</span>
                  <span className="badge bg-success">Beginner</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* YouTube Channel Section */}
      <section className="youtube-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h2>Learn from Our YouTube Channel</h2>
              <p className="lead">Join our growing community of DevOps enthusiasts with regular tutorials, live coding sessions, and industry insights.</p>
              <ul className="channel-features">
                <li><i className="fas fa-check-circle text-success me-2"></i>Weekly DevOps tutorials</li>
                <li><i className="fas fa-check-circle text-success me-2"></i>Real-world project walkthroughs</li>
                <li><i className="fas fa-check-circle text-success me-2"></i>Live Q&A sessions</li>
                <li><i className="fas fa-check-circle text-success me-2"></i>Industry expert interviews</li>
              </ul>
              <a href="https://youtube.com/your-channel" className="btn btn-danger btn-lg" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-youtube me-2"></i>Subscribe to Channel
              </a>
            </div>
            <div className="col-lg-6">
              <div className="youtube-stats">
                <div className="stat-card">
                  <div className="stat-number">{/* You can dynamically update these */}25K+</div>
                  <div className="stat-label">Subscribers</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">150+</div>
                  <div className="stat-label">Tutorial Videos</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">1M+</div>
                  <div className="stat-label">Views</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">4.9</div>
                  <div className="stat-label">Average Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Journey Section */}
      <section className="devops-process">
        <div className="container">
          <h2 className="section-title">Your Learning Journey</h2>
          <div className="row text-center">
            <div className="col-md-3 process-step">
              <div className="step-number">1</div>
              <h4>Watch & Learn</h4>
              <p>Access our YouTube tutorials and written guides to understand core concepts.</p>
            </div>
            <div className="col-md-3 process-step">
              <div className="step-number">2</div>
              <h4>Practice</h4>
              <p>Work on hands-on labs and real-world projects to reinforce your learning.</p>
            </div>
            <div className="col-md-3 process-step">
              <div className="step-number">3</div>
              <h4>Implement</h4>
              <p>Apply DevOps practices in your own projects and work environment.</p>
            </div>
            <div className="col-md-3 process-step">
              <div className="step-number">4</div>
              <h4>Share & Grow</h4>
              <p>Join our community, share your experiences, and continue learning together.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-5">
        <div className="container">
          <h2 className="section-title">Join Our Learning Community</h2>
          <div className="row">
            <div className="col-md-4">
              <div className="community-card text-center">
                <div className="community-icon">
                  <i className="fab fa-discord"></i>
                </div>
                <h4>Discord Community</h4>
                <p>Join live discussions, get help with projects, and network with fellow learners.</p>
                <a href="https://discord.gg/your-invite" className="btn btn-outline-primary" target="_blank" rel="noopener noreferrer">
                  Join Discord
                </a>
              </div>
            </div>
            <div className="col-md-4">
              <div className="community-card text-center">
                <div className="community-icon">
                  <i className="fab fa-github"></i>
                </div>
                <h4>Open Source Projects</h4>
                <p>Contribute to real DevOps projects and build your portfolio with our GitHub repos.</p>
                <a href="https://github.com/your-username" className="btn btn-outline-dark" target="_blank" rel="noopener noreferrer">
                  Explore GitHub
                </a>
              </div>
            </div>
            <div className="col-md-4">
              <div className="community-card text-center">
                <div className="community-icon">
                  <i className="fas fa-calendar-alt"></i>
                </div>
                <h4>Live Events</h4>
                <p>Participate in weekly live streams, workshops, and Q&A sessions with experts.</p>
                <button className="btn btn-outline-info" onClick={handleDemoClick}>
                  View Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <h2 className="section-title">What Our Students Say</h2>
          <div className="row">
            <div className="col-md-4">
              <div className="testimonial-card">
                <p className="testimonial-text">"The YouTube tutorials helped me transition from traditional sysadmin to DevOps engineer. The hands-on projects were exactly what I needed for my job interviews."</p>
                <div className="d-flex align-items-center">
                  <img src="https://randomuser.me/api/portraits/women/45.jpg" alt="Student" className="rounded-circle me-3" width="50" />
                  <div>
                    <h5 className="mb-0">Sarah Johnson</h5>
                    <small>DevOps Engineer</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="testimonial-card">
                <p className="testimonial-text">"I went from zero Kubernetes knowledge to deploying production applications in 3 months. The learning path was perfectly structured for beginners."</p>
                <div className="d-flex align-items-center">
                  <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Student" className="rounded-circle me-3" width="50" />
                  <div>
                    <h5 className="mb-0">Michael Chen</h5>
                    <small>Software Developer</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="testimonial-card">
                <p className="testimonial-text">"The community support and detailed tutorials helped me implement CI/CD at my company. We reduced deployment time by 80%!"</p>
                <div className="d-flex align-items-center">
                  <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Student" className="rounded-circle me-3" width="50" />
                  <div>
                    <h5 className="mb-0">Jennifer Martinez</h5>
                    <small>Team Lead</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2 className="display-5 mb-4">Start Your DevOps Journey Today</h2>
          <p className="lead mb-4">Join thousands of developers mastering modern DevOps practices.</p>
          <div className="cta-buttons">
            <button className="btn btn-light btn-lg me-3" onClick={handleGetStarted}>
              Explore Learning Paths
            </button>
            <a href="https://youtube.com/your-channel" className="btn btn-outline-light btn-lg" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-youtube me-2"></i>Watch Free Videos
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <div className="row">
            <div className="col-lg-4 mb-4">
              <h4>DevOps Learning</h4>
              <p>Your comprehensive platform for mastering DevOps practices, tools, and methodologies through expert tutorials and community learning.</p>
              <div className="social-icons mt-4">
                <a href="https://youtube.com/your-channel" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-youtube"></i>
                </a>
                <a href="https://github.com/your-username" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-github"></i>
                </a>
                <a href="https://discord.gg/your-invite" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-discord"></i>
                </a>
                <a href="https://twitter.com/your-username" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-twitter"></i>
                </a>
              </div>
            </div>
            <div className="col-lg-2 col-md-6 mb-4">
              <h5>Learning Paths</h5>
              <div className="footer-links">
                <a href="/learning/ci-cd">CI/CD Pipeline</a>
                <a href="/learning/kubernetes">Kubernetes</a>
                <a href="/learning/terraform">Infrastructure as Code</a>
                <a href="/learning/monitoring">Monitoring</a>
                <a href="/learning/security">DevSecOps</a>
              </div>
            </div>
            <div className="col-lg-2 col-md-6 mb-4">
              <h5>Resources</h5>
              <div className="footer-links">
                <a href="/blog">Blog</a>
                <a href="https://youtube.com/your-channel">YouTube</a>
                <a href="/projects">Hands-on Projects</a>
                <a href="/community">Community</a>
                <a href="/docs">Documentation</a>
              </div>
            </div>
            <div className="col-lg-2 col-md-6 mb-4">
              <h5>Company</h5>
              <div className="footer-links">
                <a href="/about">About Us</a>
                <a href="/contact">Contact</a>
                <a href="/privacy">Privacy Policy</a>
                <a href="/terms">Terms of Service</a>
              </div>
            </div>
            <div className="col-lg-2 col-md-6 mb-4">
              <h5>Support</h5>
              <div className="footer-links">
                <a href="/help">Help Center</a>
                <a href="/community">Community Forum</a>
                <a href="/contact">Contact Support</a>
              </div>
            </div>
          </div>
          <div className="copyright">
            <p>&copy; {new Date().getFullYear()} DevOps Learning Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
    );
};





export default Home;





