
import 'bootstrap/dist/css/bootstrap.min.css';
import { Form, FormGroup, Label, Input, Button } from 'reactstrap';
import React, { useState } from 'react';
import './App.css';
import { useHistory } from 'react-router-dom'
import Auction from './Auction';
import swal from "sweetalert";


function Home() {

    const url = "https://higherlayerproject-env.eba-8i2qjbtg.us-east-1.elasticbeanstalk.com"
    // const url = "http://localhost:5000"

    const history = useHistory();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [registerUserName, setRegisterUserName] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newEmail, setNewEmail] = useState("");

    const handleLogin = async (event: any) => {
        event.preventDefault();
        if (!email || !password) return;

        let serverResponse = await fetch(url+"/login", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "password": password,
                "email": email
            })
        })

        let responseJson = await serverResponse.json();
        
        if (!responseJson.name) {
            swal("An error occurred");
            return;
        }
        history.push('/auction' , {userName : responseJson.name, userId : responseJson.id});

    }


    const handleRegistration = async (event: any) => {
        event.preventDefault();
        if (!registerUserName || !newPassword || !newEmail) return;

        let serverResponse = await fetch(url+"/register", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "clientName": registerUserName,
                "password": newPassword,
                "email": newEmail
            })
        })

        let responseJson = await serverResponse.json();
        if (!responseJson.success) {
            swal(responseJson.errorMessage);
            return;
        }

        swal(responseJson.successMessage + " Please login to continue");
    }

    return (

<body id="body"> 
      <div id="form">
          <h2>Welcome To Auction System</h2>
      <h3>Login</h3>
        <br></br>
        <Form>
          <FormGroup>
           
            <div id="form-control" >
            <Label id="tx" for="user"><b>Enter your Email </b></Label>
            <Input type="text" name="user" id="user" value={email} style={{width: "250px"}} 
                        onChange={e => setEmail(e.target.value)}/>
            </div>
               
                <br></br>
                <div id="form-control" >
                <Label for="password"><b>Enter your Password </b></Label>
                <Input type="text" name="password" id="password" value={password} style={{width: "250px"}} 
                onChange={e => setPassword(e.target.value)}/>
                </div>
                
          </FormGroup>
          <Button color="success" size="lg" onClick={handleLogin}>Login</Button>
        </Form>
      </div>

      
        <br></br>
        <div id="form2">
        <Form>
          <FormGroup>
              <h3>Registration For New User</h3>
              <br></br>
            <Label for="user"><b>Enter your UserName</b></Label>
                <Input type="text" name="user" id="user" value={registerUserName}
                        onChange={e => setRegisterUserName(e.target.value)} style={{width: "250px"}} 
                        />
                <br></br>
                <Label for="newEmail"><b>Enter your Email</b></Label>
                <Input type="text" name="newEmail" id="newEmail" style={{width: "250px"}} 
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                required/>
                <br></br>
                <Label for="password"><b>Enter your Password</b></Label>
                <Input type="text" name="password" id="password" value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        required style={{width: "250px"}} 
                />
          </FormGroup>
          <Button color="success" size="lg" onClick={handleRegistration}>Register</Button>
        </Form>
        </div>
       
   



       
    
      </body>
       
    );
}

export default Home;
