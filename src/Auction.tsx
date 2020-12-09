import React, { useEffect, useState, useRef, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Container, Row, Col, Form, FormGroup, Label, Input, Button, ListGroup, ListGroupItem, Navbar, NavbarBrand } from 'reactstrap';
import swal from "sweetalert";

import {  RouteProps, useHistory, useLocation } from 'react-router-dom'
import io from 'socket.io-client';


interface AuctionItem {
    id : number
    name : string
    currentHighestBid : number
    description : String
    bidderId : String
    bidderName : String
    sellerId : String
    sellerName : String
    startTime : number
    endTime : number
    auctionDuaration : number
    price : number
    bidStatus : string
    timeLeft : number
}

interface AuctionObject {
    [id : number] : AuctionItem
}

interface TimerObject {
    [id : number] : number
}


interface LocationState {
      userName: string
      userId : number
  }

  interface Props  {
    socket : SocketIOClient.Socket
  }


const Auction : React.FC<Props> = (props)  => {

    const location = useLocation<LocationState>();
    const history = useHistory();

    let socket = props.socket
    let [userName, setUserName] = useState("");
    let [userId, setUserId] = useState(Number);
    let [auctionItemsObj, setAuctionItemsObj] = useState({} as AuctionObject);
    let [messages, setMessages] = useState([] as Array<String>);
    let [timerObject , setTimerObject] = useState({} as TimerObject);
    let [countDown, setCountDown] = useState(0);
    let [newSaleItemName , setNewSaleItemName] = useState("");
    let [newSaleItemPrice, setNewSaleItemPrice] = useState(0);
    let [newSaleItemDescription, setNewSaleItemDescription] = useState("");
    let [biddingItemId, setBiddingItemId] = useState("");
    let [biddingItemPrice, setBiddingItemPrice] = useState(0);

    const url = "https://higherlayerproject-env.eba-8i2qjbtg.us-east-1.elasticbeanstalk.com"
    // const url = "http://localhost:5000"


    // return (
    //     <div>

    //     </div>
    // )


    useEffect(() => {

        if(!location.state)   {
            history.push("/");
            return;
        }
        let userNameFromLogin = location.state.userName;
        let userIdFromLogin = location.state.userId;

        if(!userNameFromLogin || (!userIdFromLogin && userIdFromLogin !== 0))   {
            history.push("/");
            return;
        }

        setUserName(userNameFromLogin);
        setUserId(userIdFromLogin);

        (async function checkUserId(userIdFromLogin : number) {
             let response = await fetch(url+"/userId",{
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                }, body: JSON.stringify({
                    userId : userIdFromLogin
                })
            })
            let responseJson = await response.json();
            if(!responseJson || !responseJson.success)  history.push("/");
         })(userIdFromLogin)

         
    }, [location])


    

    useEffect( () => {
        (async function getAuctionItems () {
            let response = await fetch(url+"/getAllAuctionItems",{
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                }
            })
            let responseJson: AuctionObject = await response.json()
            Object.values(responseJson).forEach( (auctionItem : AuctionItem) => {
                activateTimer(auctionItem);
            })

            
            setAuctionItemsObj( {...auctionItemsObj,  ...responseJson });


        })()

    },[])



    useEffect(() => {
        socket.on("updateAuctionItems",  (itemData : {message : string, auctionItem : AuctionItem}) => {
            messages.push(itemData.message);
            setMessages(messages);
            auctionItemsObj = {...auctionItemsObj }
            activateTimer(itemData.auctionItem)
            auctionItemsObj[itemData.auctionItem.id] = itemData.auctionItem
            debugger
            setAuctionItemsObj(auctionItemsObj);
        })

        return () => {
            socket.off('updateAuctionItems');
        }
    },[auctionItemsObj])

    const activateTimer = (auctionItem : AuctionItem ) => {
        let interval = setInterval( () => { 
            debugger
            if(auctionItem.bidStatus  === 'Inactive'){
                timerObject[auctionItem.id] = 0;
                auctionItem.timeLeft = 0;
                setTimerObject(timerObject);
                clearInterval(interval);
                return;
            }
            let curTime = Math.round((auctionItem.endTime - Date.now()) / 1000);
            if(curTime < 0)  {
                clearInterval(interval);
                return;
            }
            timerObject[auctionItem.id] = curTime ;
            setTimerObject(timerObject);
            setCountDown(timerObject[auctionItem.id]);
        },1000,auctionItem )

    }
    


    let addItemToAution = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        if(!newSaleItemName || (!newSaleItemPrice && newSaleItemPrice !== 0) || !newSaleItemDescription) {
            return;
        }

        let response = await fetch(url+"/offerSaleItem",{
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                'itemName' : newSaleItemName,
                'price' : newSaleItemPrice,
                'description' : newSaleItemDescription,
                'id' : userId
            })
        })
        let responseJson = await response.json();
        if(!responseJson.success){
            swal(responseJson.errorMessage);
            return;
        }

        swal(responseJson.successMessage);

    }

    let placeBid = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        if(!biddingItemId || (!biddingItemPrice && biddingItemPrice !== 0)) {
            return;
        }

        let response = await fetch(url+"/bidForItem",{
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                'itemId' : biddingItemId,
                'bidPrice' : biddingItemPrice,
                'clientId' : userId
            })
        })
        let responseJson = await response.json();
        if(!responseJson.success){
            swal(responseJson.errorMessage);
            return;
        }
        swal(responseJson.successMessage);

    }

    const cancelRegistration = async () => {
        let response = await fetch(url+"/deRegister",{
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                'id' : userId
            })
        })
        let responseJson = await response.json();
        if(!responseJson.success){
            swal(responseJson.errorMessage);
            return;
        }
        swal(responseJson.successMessage);
        history.push("/");
    }

    return (
        
      <div>
      <Navbar color="light" light expand="md">
          <NavbarBrand><b>Hi, {userName} (ID: {userId})</b></NavbarBrand>
      </Navbar>
      <br></br>
      <Container fluid={true}>
          <Row>
              <Col xs="8">
                  <div style={{height: "50vh", overflow: "scroll"}}>
                  <Table>
                      <thead>
                          <tr>
                              <th>Item ID</th>
                              <th>Item Name</th>
                              <th>Item Description</th>
                              <th>Owner ID</th>
                              <th>Owner Name</th>
                              <th>Item's initial price </th>
                              <th>Current highest bid</th>
                              <th>Bidder ID</th>
                              <th>Bidder Name</th>
                              <th>Time left</th>
                              <th>Bid Status</th>
                          </tr>
                      </thead>
                      <tbody>
                      {Object.keys(auctionItemsObj).sort( (a,b) => parseInt(a) - parseInt(b)).map(
                          (item, i) => {
                            let itemId = parseInt(item)
                          return (
                              
                              <tr key={i}>
                                  <th scope="row">{itemId}</th>
                                  <td>{auctionItemsObj[itemId].name}</td>
                                  <td>{auctionItemsObj[itemId].description}</td>
                                  <td>{auctionItemsObj[itemId].sellerId}</td>
                                  <td>{auctionItemsObj[itemId].sellerName}</td>
                                  <td>{auctionItemsObj[itemId].price}</td>
                                  <td>{auctionItemsObj[itemId].currentHighestBid}</td>
                                  <td>{auctionItemsObj[itemId].bidderId}</td>
                                  <td>{auctionItemsObj[itemId].bidderName}</td>
                                  <td>{timerObject[itemId]}</td>
                                  {/* <td>{countDown}</td> */}
                                  <td>{auctionItemsObj[itemId].bidStatus}</td>
                              </tr>
                          )
                          })
                      }


                      </tbody>
                  </Table>
                  </div>
                  <hr></hr>
                  <div style={{height: "30vh", overflow: "scroll"}}>
                  <ListGroup>
                      {(messages).map( 
                          (message, i) => (
                              <ListGroupItem key={i} >{message}</ListGroupItem>
                          ))
                      }
                  </ListGroup>
                  </div>
              </Col>
              <Col xs="4">
                  <Form>
                      <FormGroup>
                          <Label for="AddItemToAuctionName">Enter the item name to be added to the auction</Label>
                          <Input type="text" name="AddItemToAuctionName" id="AddItemToAuctionName" value={newSaleItemName} onChange={e => setNewSaleItemName(e.target.value)} />
                      </FormGroup>
                      <FormGroup> 
                          <Label for="AddItemToAuctionPrice">Enter the price for the item</Label>
                          <Input type="number" name="AddItemToAuctionPrice" id="AddItemToAuctionPrice" value={newSaleItemPrice} onChange={e => setNewSaleItemPrice(parseInt(e.target.value))} />
                      </FormGroup>
                      <FormGroup>
                          <Label for="AddItemToAuctionName">Enter the item name to be added to the auction</Label>
                          <Input type="text" name="AddItemToAuctionName" id="AddItemToAuctionName" value={newSaleItemDescription} onChange={e => setNewSaleItemDescription(e.target.value)} />
                      </FormGroup>
                      <Button color="primary" size="lg" onClick={addItemToAution}>Add Item</Button>
                  </Form>
                  <hr></hr>
                  <Form>
                      <FormGroup>
                          <Label for="biddingItemId">Enter the item id you want to bid</Label>
                          <Input type="number" name="biddingItemId" id="biddingItemId" value={biddingItemId} onChange={e => setBiddingItemId(e.target.value)} />
                      </FormGroup>
                      <FormGroup> 
                          <Label for="biddingItemPrice">Enter the price for the item</Label>
                          <Input type="number" name="biddingItemPrice" id="biddingItemPrice" value={biddingItemPrice} onChange={e => setBiddingItemPrice(parseInt(e.target.value))} />
                      </FormGroup>
                      <Button color="primary" size="lg" onClick={placeBid}>Place a bid</Button>
                  </Form>
                  <br></br>
                   <Button color="danger" size="lg" onClick={cancelRegistration} style={{float: "right"}}>Cancel Registration</Button>
              </Col>
          </Row>
      </Container>
    </div>
    )
}

export default Auction

