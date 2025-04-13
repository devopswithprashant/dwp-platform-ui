//import React, {useState} from 'react'
import React from 'react'

export default function Home(props) {
    // const handleUpClick = ()=>{
    //     //console.log("Uppercase button clicked");
    //     let newtext = text.toUpperCase();
    //     setText(newtext);
    // }
    // const handleloClick = ()=>{
    //     let newtext = text.toLowerCase();
    //     setText(newtext);
    // }
    // const handleOnchange = (event)=>{
    //     //console.log("On change")
    //     setText(event.target.value)
    // }

    // const [text , setText] = useState('');

    // setText("jgfbkjwehfgajflk");

    return (
        <div className="container">
            <h1>{props.heading}</h1>
            <p>This is content of Devops with Prashant</p> 
        </div>
        // <>
        // <div className="container">
        //     <h1>{props.heading}</h1>
        //     <div className="mb-3">
        //         <label htmlFor="myBox" className="form-label">Input here</label>
        //         <textarea className="form-control" value={text} onChange={handleOnchange} id="myBox" rows="7"></textarea>
        //     </div>
        //     <button className="btn btn-primary" onClick={handleUpClick} >Convert to uppercase</button>
        //     <button className="btn btn-primary mx-1" onClick={handleloClick} >Convert to lowercase</button>
        // </div>
        // <div className="container my-3">
        //     <h1>Your Text summary</h1>
        //     <p>{text.split(" ").length} words and {text.length} characters</p>
        //     <p>{0.008 * text.split(" ").length} minutes</p>
        //     <h2>Preview</h2>
        //     <p>{text}</p>
        // </div>
        // </>

    )
}
