import { useLayoutEffect, useRef, useState } from 'react';
import { NavBar } from '../components/NavBar';
import { v4 as uuidv4 } from 'uuid';
import { notfiyUser } from '../Notifcation';
import {useAuthUser} from 'react-auth-kit'
import { overlayContent } from '../App';
import { Overlay } from '../components/Overlay';


export function ChatPage() {
    const auth = useAuthUser()
    const user = auth()

    const dynamicTextField = useRef()
    const [ textFieldShown, setTextFieldShown ] = useState(true)
    const [ allMessages, setAllMessages ] = useState([])
    const [ userMessage, setUserMessage ] = useState("")
    const [ chatSession, setChatSession ] = useState(null)

    useLayoutEffect(() => {
        dynamicTextField.current.baseScrollHeight = dynamicTextField.current.scrollHeight;

        setChatSession(uuidv4())
    }, [])

    function adjustHeight(textarea) {
        textarea.style.height = 'auto'; // Reset height
        textarea.style.height = `${Math.min(textarea.scrollHeight, 3 * textarea.baseScrollHeight)}px`;
    }

    function displayTextField() {
        return <div className="text-field-container">
            <div className='text-field'>
                <textarea ref={dynamicTextField} value={userMessage} onChange={(e) => {setUserMessage(e.target.value); adjustHeight(e.target)}} rows="1" placeholder='Write your message here ...'></textarea>
                <span onClick={sendMessage} className="send-btn">Send</span>
            </div>
        </div>
    }

    function sendMessage() {
        if (userMessage.length < 3) {return notfiyUser("Please enter a valid question.")}
        setAllMessages((currentMessages) => {
            let newMessages = [
                {
                    role: "user",
                    text: userMessage
                },
                {
                    role: "system",
                    text: "Writing ..."
                }
            ]
            currentMessages.push(...newMessages)
            console.log(currentMessages)
            return currentMessages
        })
        setTextFieldShown(false)
        setUserMessage("")
        fetchMessage({
            chatSession,
            userMessage
        })
        .then(data => {
            if (data.msg) {
                setAllMessages(data.messages)
                setTextFieldShown(true)
            }
            else {
                notfiyUser("Unfortunately, there was a technical error. Please try again later.")
            }
        })
    }

    async function fetchMessage (inputData) {
        const response = await fetch(window.location.origin+'/api/process-message', {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(inputData)
        });
        const data = await response.json();
        return data;
    }

    return <>
        <div className="content-container">
            <div className="messages">
                <div style={{padding: "2.5dvh"}} className="message app-message">
                    <span>👋🏼 Hey {user.name}, what do you want to talk about today? Just ask me anything.</span>
                </div>
                {allMessages.map((message, index) => {
                    if (message.role === "user") {
                        return <div key={index} className="message user-message">
                            <span>{message.text}</span>
                        </div>
                    }
                    else if (message.role === "system") {
                        return <div key={index} className="message app-message">
                            <span>{message.text}</span>
                            {(message.faithfulness) ? <div onClick={() => { overlayContent.value = {title: "Definition of 'Based on academic literature'", text: "To make our chatbot system truthful and stating facts based on research in nutrition science, we gave access to academic papers to the chatbot. The percentage you can see will tell you how much of the answer is based on these manually picked academic papers."} }} className="faithfulness-container">{parseInt(message.faithfulness*100)}% based on academic papers</div> : ""}
                        </div>
                    }
                })}
            </div>
        </div>
        {(textFieldShown) ? displayTextField() : ""}
        <NavBar />
        {(overlayContent.value) ? <Overlay /> : ""}
    </>
}