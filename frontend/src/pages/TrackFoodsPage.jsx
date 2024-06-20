import {useAuthUser} from 'react-auth-kit'
import { Link } from 'react-router-dom';
import React, { useDeferredValue, useEffect, useState, useTransition } from 'react'
import { overlayContent, user_vector } from '../App'
import { NavBar } from '../components/NavBar';
import { AudioRecorder, useAudioRecorder } from 'react-audio-voice-recorder';
import { notfiyUser } from '../Notifcation';
import { Overlay } from '../components/Overlay';
import { signal } from '@preact/signals-react';
import { FoodChoice } from '../components/FoodChoice';

export const foodChosen = signal(null)

export function TrackFoodsPage () {
    const auth = useAuthUser()
    const user = auth()

    const [ audioRecChosen, setAudioRecChosen ] = useState(false)
    const [ typingChosen, setTypingChosen ] = useState(false)
    const [ loadingFoods, setLoadingFoods ] = useState(false)

    const [ loggedFoods, setLoggedFoods ] = useState(null)
    const [ recentlyLoggedFoods, setRecentlyLoggedFoods ] = useState(null)
    const [ foodSuggestions, setFoodSuggestions ] = useState(null)
    const [ foodSearch, setFoodSearch ] = useState("")
    const deferredSearch = useDeferredValue(foodSearch)

    // Get Recently Logged foods from database
    useEffect(() => {
        fetchTodaysFoods()
    }, [typingChosen])

    const {
        startRecording,
        stopRecording,
        togglePauseResume,
        recordingBlob,
        isRecording,
        isPaused,
        recordingTime,
        mediaRecorder
    } = useAudioRecorder();

    function startRecorder () {
        setAudioRecChosen(true)
        startRecording()
    }

    function stopRecorder () {
        setAudioRecChosen(false)
        stopRecording()
    }

    useEffect(() => {
        if (!recordingBlob) return;
        
        setLoadingFoods(true)
        // recordingBlob will be present at this point after 'stopRecording' has been called
        console.log(recordingBlob)
        const url = URL.createObjectURL(recordingBlob);
        const formData = new FormData()
        formData.append('recording', recordingBlob, 'recording.webm')
        fetchAudio(formData)
        .then(data => {
            if (data.msg) {
                // setLoggedFoods(data.detected_foods)
                setLoadingFoods(false)
                fetchTodaysFoods()
            }
        })

    }, [recordingBlob])

    async function fetchAudio (formData) {
        const response = await fetch(window.location.origin+'/api/speech-to-foods', {
            method: "POST",
            credentials: "same-origin",
            body: formData
        });
        const data = await response.json();
        return data;
    }

    async function fetchImage (formData) {
        const response = await fetch(window.location.origin+'/api/detect-food-image', {
            method: "POST",
            credentials: "same-origin",
            body: formData
        });
        const data = await response.json();
        return data;
    }
    
    async function fetchTodaysFoods () {
        setLoadingFoods(true)
        const response = await fetch(window.location.origin+'/api/get-todays-foods', {
            method: "GET",
            credentials: "same-origin"
        })
        .then(res => res.json().then(data => {
            if (data.msg) {
                setLoadingFoods(false)
                setLoggedFoods(data.foods)
            }   
            else {
                notfiyUser("Technical error when getting today's logged foods")
            }
        })
        )
    }

    useEffect(() => {
        if (deferredSearch.length > 1) {
            searchFoods({
                query: deferredSearch
            })
            .then(data => {
                if (data.msg) {
                    setFoodSuggestions(data.query_results)
                }   
                else {
                    notfiyUser("Technical error")
                }
            })
        }
    }, [deferredSearch])

    async function searchFoods (inputData) {
        const response = await fetch(window.location.origin+'/api/search-foods', {
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

    function showOverlay(type, url) {
        console.log("Overlay opened", type)
        if (type === "usda") {
            console.log("This actually worked")
            overlayContent.value = {
                title: "What is the data origin 'USDA'",
                text: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ratione architecto quos alias dignissimos, quam hic asperiores, atque rem delectus ut minima ea! Omnis animi ad deserunt mollitia perspiciatis debitis vel."+" "+url
            }
        }
    }

    if (typingChosen) {
        return <>
        <div className="content-container">
            <div style={{display: "grid", gridTemplateColumns: "1fr 4fr", gap: "1rem"}}>
                <div className='shadow-box h1' onClick={() => {setTypingChosen(false); setFoodSearch(""); setFoodSuggestions(null)}}>
                    Back
                </div>
                <div className="shadow-box h1">
                    <div className="emoji-text">
                        <svg width="26" height="24" viewBox="0 0 26 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16.8906 3C16.6049 3 16.375 3.22988 16.375 3.51562C16.375 4.35137 16.8777 4.7918 17.215 5.08613L17.2387 5.10762C17.5889 5.4127 17.75 5.57598 17.75 5.92188C17.75 6.20762 17.9799 6.4375 18.2656 6.4375C18.5514 6.4375 18.7812 6.20762 18.7812 5.92188C18.7812 5.08613 18.2785 4.6457 17.9412 4.35137L17.9176 4.32988C17.5674 4.0248 17.4062 3.86152 17.4062 3.51562C17.4062 3.22988 17.1764 3 16.8906 3ZM15.6875 7.125C15.3072 7.125 15 7.43223 15 7.8125V11.9375C15 13.0762 15.9238 14 17.0625 14H21.1875C22.3262 14 23.25 13.0762 23.25 11.9375H23.5938C24.9236 11.9375 26 10.8611 26 9.53125C26 8.20137 24.9236 7.125 23.5938 7.125H22.5625H15.6875ZM23.25 8.5H23.5938C24.1631 8.5 24.625 8.96191 24.625 9.53125C24.625 10.1006 24.1631 10.5625 23.5938 10.5625H23.25V8.5ZM19.8125 3.51562C19.8125 3.22988 19.5826 3 19.2969 3C19.0111 3 18.7812 3.22988 18.7812 3.51562C18.7812 4.35137 19.284 4.7918 19.6213 5.08613L19.6449 5.10762C19.9951 5.4127 20.1562 5.57598 20.1562 5.92188C20.1562 6.20762 20.3861 6.4375 20.6719 6.4375C20.9576 6.4375 21.1875 6.20762 21.1875 5.92188C21.1875 5.08613 20.6848 4.6457 20.3475 4.35137L20.3238 4.32988C19.9736 4.0248 19.8125 3.86152 19.8125 3.51562Z" fill="#DA9759"/>
                            <path d="M9.03354 18.2857C8.66458 18.2857 8.36667 17.9955 8.36667 17.6361C8.36667 17.5937 8.37125 17.5535 8.38042 17.5111C8.50187 17.0424 9.43917 14 13.5 14C17.5608 14 18.4981 17.0424 18.6196 17.5111C18.631 17.5535 18.6333 17.5937 18.6333 17.6361C18.6333 17.9955 18.3354 18.2857 17.9665 18.2857H9.03354ZM10.9333 16.1428C10.9333 16.0481 10.8947 15.9573 10.8259 15.8903C10.7572 15.8233 10.6639 15.7857 10.5667 15.7857C10.4694 15.7857 10.3762 15.8233 10.3074 15.8903C10.2386 15.9573 10.2 16.0481 10.2 16.1428C10.2 16.2375 10.2386 16.3284 10.3074 16.3954C10.3762 16.4623 10.4694 16.5 10.5667 16.5C10.6639 16.5 10.7572 16.4623 10.8259 16.3954C10.8947 16.3284 10.9333 16.2375 10.9333 16.1428ZM16.4333 16.5C16.5306 16.5 16.6238 16.4623 16.6926 16.3954C16.7614 16.3284 16.8 16.2375 16.8 16.1428C16.8 16.0481 16.7614 15.9573 16.6926 15.8903C16.6238 15.8233 16.5306 15.7857 16.4333 15.7857C16.3361 15.7857 16.2428 15.8233 16.1741 15.8903C16.1053 15.9573 16.0667 16.0481 16.0667 16.1428C16.0667 16.2375 16.1053 16.3284 16.1741 16.3954C16.2428 16.4623 16.3361 16.5 16.4333 16.5ZM13.8667 15.4285C13.8667 15.3338 13.828 15.243 13.7593 15.176C13.6905 15.109 13.5972 15.0714 13.5 15.0714C13.4028 15.0714 13.3095 15.109 13.2407 15.176C13.172 15.243 13.1333 15.3338 13.1333 15.4285C13.1333 15.5233 13.172 15.6141 13.2407 15.6811C13.3095 15.7481 13.4028 15.7857 13.5 15.7857C13.5972 15.7857 13.6905 15.7481 13.7593 15.6811C13.828 15.6141 13.8667 15.5233 13.8667 15.4285ZM8 20.0714C8 19.4799 8.49271 19 9.1 19H17.9C18.5073 19 19 19.4799 19 20.0714C19 20.6629 18.5073 21.1428 17.9 21.1428H9.1C8.49271 21.1428 8 20.6629 8 20.0714ZM8.36667 22.2143C8.36667 22.0178 8.53167 21.8571 8.73333 21.8571H18.2667C18.4683 21.8571 18.6333 22.0178 18.6333 22.2143V22.5714C18.6333 23.3593 17.9756 24 17.1667 24H9.83333C9.02438 24 8.36667 23.3593 8.36667 22.5714V22.2143Z" fill="#DA9759"/>
                            <path d="M10.2267 0.1871C9.83338 0.28064 7.26555 1.71553 8.1004 5.22605L8.74972 7.95645C8.95437 8.81701 9.82631 9.34889 10.6941 9.14252L11.4808 8.95544L12.2229 12.0759C12.3255 12.5074 12.7599 12.7724 13.195 12.6689C13.6302 12.5655 13.8988 12.1332 13.7962 11.7017L13.0541 8.58128L12.4048 5.85088L11.1989 0.780134C11.0963 0.348634 10.6618 0.0836213 10.2267 0.1871ZM1.6661 2.63504C1.61856 2.43513 1.42918 2.30502 1.22238 2.33102C1.01557 2.35702 0.867422 2.53134 0.868973 2.73445L0.914298 6.2344C0.916406 6.39617 0.936302 6.55628 0.973406 6.7123C1.23951 7.83128 2.32096 8.54515 3.44852 8.38261L4.74949 13.8532C4.85211 14.2847 5.28656 14.5497 5.72168 14.4462C6.15681 14.3427 6.42545 13.9105 6.32283 13.479L5.02186 8.00845C6.10189 7.646 6.7462 6.52172 6.4801 5.40274C6.44299 5.24672 6.38868 5.09479 6.31774 4.94939L4.78266 1.80373C4.69203 1.61923 4.47692 1.53387 4.28301 1.60316C4.08911 1.67246 3.97857 1.87389 4.02611 2.0738L4.80414 5.3454C4.83545 5.47705 4.75279 5.61004 4.62004 5.64161C4.49466 5.67142 4.3688 5.6009 4.32694 5.47949L3.22887 2.22733C3.16354 2.02908 2.95739 1.91584 2.75335 1.96436C2.5493 2.01288 2.4162 2.20681 2.44711 2.41324L2.93306 5.81097C2.95034 5.93823 2.8697 6.05786 2.74432 6.08768C2.61157 6.11924 2.47789 6.0377 2.44659 5.90606L1.66856 2.63445L1.6661 2.63504ZM3.73471 6.05821L3.72733 6.05996L3.71996 6.06172L3.72327 6.0429L3.73471 6.05821Z" fill="#50B04E"/>
                        </svg>
                        <span>What did you eat today?</span>
                    </div>
                </div>
            </div>
            <div className="typing-container">
                <div className="shadow-box h1 input-shadow-box">
                    <input value={foodSearch} onChange={(e) => {setFoodSearch(e.target.value)}} onLoad={(e) => { e.target.focus() }} type="text" placeholder='Enter a food name ...' />
                </div>
                <div className="foods">
                    {(foodSuggestions) ? foodSuggestions.map((sug, index) => {
                        return <div key={index} className="shadow-box food">
                            <span onClick={() => { showOverlay("usda", sug.data_url) }} className='data-origin'>{sug.data_origin}</span>
                            <img src="/src/img/lemon.png" alt="" className='food-img' />
                            <div className='food-details'>
                                <span>{sug.food_name}</span>
                            </div>
                            <span onClick={() => { foodChosen.value = {name: sug.food_name, dataOrigin: sug.data_origin} }} className="prim-btn">ADD</span>
                        </div>
                    }) : ""}
                </div>
            </div>
            <NavBar />
        </div>
        {(overlayContent.value) ? <Overlay /> : ""}
        {(foodChosen.value) ? <FoodChoice /> : ""}
        </>
    }

    if (audioRecChosen) {
        return <>
        <div className="content-container">
            <div className="shadow-box h1">
                <div className="emoji-text">
                    <svg width="26" height="24" viewBox="0 0 26 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16.8906 3C16.6049 3 16.375 3.22988 16.375 3.51562C16.375 4.35137 16.8777 4.7918 17.215 5.08613L17.2387 5.10762C17.5889 5.4127 17.75 5.57598 17.75 5.92188C17.75 6.20762 17.9799 6.4375 18.2656 6.4375C18.5514 6.4375 18.7812 6.20762 18.7812 5.92188C18.7812 5.08613 18.2785 4.6457 17.9412 4.35137L17.9176 4.32988C17.5674 4.0248 17.4062 3.86152 17.4062 3.51562C17.4062 3.22988 17.1764 3 16.8906 3ZM15.6875 7.125C15.3072 7.125 15 7.43223 15 7.8125V11.9375C15 13.0762 15.9238 14 17.0625 14H21.1875C22.3262 14 23.25 13.0762 23.25 11.9375H23.5938C24.9236 11.9375 26 10.8611 26 9.53125C26 8.20137 24.9236 7.125 23.5938 7.125H22.5625H15.6875ZM23.25 8.5H23.5938C24.1631 8.5 24.625 8.96191 24.625 9.53125C24.625 10.1006 24.1631 10.5625 23.5938 10.5625H23.25V8.5ZM19.8125 3.51562C19.8125 3.22988 19.5826 3 19.2969 3C19.0111 3 18.7812 3.22988 18.7812 3.51562C18.7812 4.35137 19.284 4.7918 19.6213 5.08613L19.6449 5.10762C19.9951 5.4127 20.1562 5.57598 20.1562 5.92188C20.1562 6.20762 20.3861 6.4375 20.6719 6.4375C20.9576 6.4375 21.1875 6.20762 21.1875 5.92188C21.1875 5.08613 20.6848 4.6457 20.3475 4.35137L20.3238 4.32988C19.9736 4.0248 19.8125 3.86152 19.8125 3.51562Z" fill="#DA9759"/>
                        <path d="M9.03354 18.2857C8.66458 18.2857 8.36667 17.9955 8.36667 17.6361C8.36667 17.5937 8.37125 17.5535 8.38042 17.5111C8.50187 17.0424 9.43917 14 13.5 14C17.5608 14 18.4981 17.0424 18.6196 17.5111C18.631 17.5535 18.6333 17.5937 18.6333 17.6361C18.6333 17.9955 18.3354 18.2857 17.9665 18.2857H9.03354ZM10.9333 16.1428C10.9333 16.0481 10.8947 15.9573 10.8259 15.8903C10.7572 15.8233 10.6639 15.7857 10.5667 15.7857C10.4694 15.7857 10.3762 15.8233 10.3074 15.8903C10.2386 15.9573 10.2 16.0481 10.2 16.1428C10.2 16.2375 10.2386 16.3284 10.3074 16.3954C10.3762 16.4623 10.4694 16.5 10.5667 16.5C10.6639 16.5 10.7572 16.4623 10.8259 16.3954C10.8947 16.3284 10.9333 16.2375 10.9333 16.1428ZM16.4333 16.5C16.5306 16.5 16.6238 16.4623 16.6926 16.3954C16.7614 16.3284 16.8 16.2375 16.8 16.1428C16.8 16.0481 16.7614 15.9573 16.6926 15.8903C16.6238 15.8233 16.5306 15.7857 16.4333 15.7857C16.3361 15.7857 16.2428 15.8233 16.1741 15.8903C16.1053 15.9573 16.0667 16.0481 16.0667 16.1428C16.0667 16.2375 16.1053 16.3284 16.1741 16.3954C16.2428 16.4623 16.3361 16.5 16.4333 16.5ZM13.8667 15.4285C13.8667 15.3338 13.828 15.243 13.7593 15.176C13.6905 15.109 13.5972 15.0714 13.5 15.0714C13.4028 15.0714 13.3095 15.109 13.2407 15.176C13.172 15.243 13.1333 15.3338 13.1333 15.4285C13.1333 15.5233 13.172 15.6141 13.2407 15.6811C13.3095 15.7481 13.4028 15.7857 13.5 15.7857C13.5972 15.7857 13.6905 15.7481 13.7593 15.6811C13.828 15.6141 13.8667 15.5233 13.8667 15.4285ZM8 20.0714C8 19.4799 8.49271 19 9.1 19H17.9C18.5073 19 19 19.4799 19 20.0714C19 20.6629 18.5073 21.1428 17.9 21.1428H9.1C8.49271 21.1428 8 20.6629 8 20.0714ZM8.36667 22.2143C8.36667 22.0178 8.53167 21.8571 8.73333 21.8571H18.2667C18.4683 21.8571 18.6333 22.0178 18.6333 22.2143V22.5714C18.6333 23.3593 17.9756 24 17.1667 24H9.83333C9.02438 24 8.36667 23.3593 8.36667 22.5714V22.2143Z" fill="#DA9759"/>
                        <path d="M10.2267 0.1871C9.83338 0.28064 7.26555 1.71553 8.1004 5.22605L8.74972 7.95645C8.95437 8.81701 9.82631 9.34889 10.6941 9.14252L11.4808 8.95544L12.2229 12.0759C12.3255 12.5074 12.7599 12.7724 13.195 12.6689C13.6302 12.5655 13.8988 12.1332 13.7962 11.7017L13.0541 8.58128L12.4048 5.85088L11.1989 0.780134C11.0963 0.348634 10.6618 0.0836213 10.2267 0.1871ZM1.6661 2.63504C1.61856 2.43513 1.42918 2.30502 1.22238 2.33102C1.01557 2.35702 0.867422 2.53134 0.868973 2.73445L0.914298 6.2344C0.916406 6.39617 0.936302 6.55628 0.973406 6.7123C1.23951 7.83128 2.32096 8.54515 3.44852 8.38261L4.74949 13.8532C4.85211 14.2847 5.28656 14.5497 5.72168 14.4462C6.15681 14.3427 6.42545 13.9105 6.32283 13.479L5.02186 8.00845C6.10189 7.646 6.7462 6.52172 6.4801 5.40274C6.44299 5.24672 6.38868 5.09479 6.31774 4.94939L4.78266 1.80373C4.69203 1.61923 4.47692 1.53387 4.28301 1.60316C4.08911 1.67246 3.97857 1.87389 4.02611 2.0738L4.80414 5.3454C4.83545 5.47705 4.75279 5.61004 4.62004 5.64161C4.49466 5.67142 4.3688 5.6009 4.32694 5.47949L3.22887 2.22733C3.16354 2.02908 2.95739 1.91584 2.75335 1.96436C2.5493 2.01288 2.4162 2.20681 2.44711 2.41324L2.93306 5.81097C2.95034 5.93823 2.8697 6.05786 2.74432 6.08768C2.61157 6.11924 2.47789 6.0377 2.44659 5.90606L1.66856 2.63445L1.6661 2.63504ZM3.73471 6.05821L3.72733 6.05996L3.71996 6.06172L3.72327 6.0429L3.73471 6.05821Z" fill="#50B04E"/>
                    </svg>
                    <span>What did you eat today?</span>
                </div>
            </div>
            <div className="audio-instructions">
                <h3>Say something like:</h3>
                <p>
                    Today I had chili cin carne for lunch 
                    and then for dinner I ate a bowl of red lentils with rice and bell pepper ...
                </p>
                <div onClick={() => {stopRecorder()}} className="track-method-circle">
                    <svg width="21.6" height="31.2" viewBox="0 0 27 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.4398 0C9.39262 0 6.10902 3.27539 6.10902 7.3125V19.5C6.10902 23.5371 9.39262 26.8125 13.4398 26.8125C17.4871 26.8125 20.7707 23.5371 20.7707 19.5V7.3125C20.7707 3.27539 17.4871 0 13.4398 0ZM3.66541 16.4531C3.66541 15.44 2.84833 14.625 1.83271 14.625C0.817082 14.625 0 15.44 0 16.4531V19.5C0 26.2869 5.05522 31.8932 11.6071 32.7844V35.3438H7.94173C6.9261 35.3438 6.10902 36.1588 6.10902 37.1719C6.10902 38.185 6.9261 39 7.94173 39H13.4398H18.938C19.9536 39 20.7707 38.185 20.7707 37.1719C20.7707 36.1588 19.9536 35.3438 18.938 35.3438H15.2726V32.7844C21.8245 31.8932 26.8797 26.2869 26.8797 19.5V16.4531C26.8797 15.44 26.0626 14.625 25.047 14.625C24.0314 14.625 23.2143 15.44 23.2143 16.4531V19.5C23.2143 24.8854 18.8387 29.25 13.4398 29.25C8.041 29.25 3.66541 24.8854 3.66541 19.5V16.4531Z" fill="#DA9759"/>
                    </svg>
                </div>
                <p>
                    Press to stop recording
                </p>
            </div>
            <NavBar />
        </div>
        </>
    }

    function detectImage(e) {
        console.log("Detected image event", e.target.files[0])

        setLoadingFoods(true)
        const formData = new FormData()
        formData.append('image', e.target.files[0])
        fetchImage(formData)
        .then(data => {
            if (data.msg) {
                console.log(data)
                setLoadingFoods(false)
                fetchTodaysFoods()
            }
            else {
                notfiyUser("Sorry, there was an technical error. Please try to log the food via image again.")
            }
        })
    }

    function removeLoggedFood(foodName, amount) {
        fetchRemoval({
            name: foodName,
            amount: amount
        })
        .then(data => {
            if (data.msg) {
                notfiyUser(foodName+" was successfully removed from the logs")
                fetchTodaysFoods()
            }
            else {
                notfiyUser("Item was unable to be removed.")
            }
        })
    }

    async function fetchRemoval(inputData) {
        const response = await fetch(window.location.origin+'/api/remove-single-food', {
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
            <div className="shadow-box h1">
                <div className="emoji-text">
                    <svg width="26" height="24" viewBox="0 0 26 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16.8906 3C16.6049 3 16.375 3.22988 16.375 3.51562C16.375 4.35137 16.8777 4.7918 17.215 5.08613L17.2387 5.10762C17.5889 5.4127 17.75 5.57598 17.75 5.92188C17.75 6.20762 17.9799 6.4375 18.2656 6.4375C18.5514 6.4375 18.7812 6.20762 18.7812 5.92188C18.7812 5.08613 18.2785 4.6457 17.9412 4.35137L17.9176 4.32988C17.5674 4.0248 17.4062 3.86152 17.4062 3.51562C17.4062 3.22988 17.1764 3 16.8906 3ZM15.6875 7.125C15.3072 7.125 15 7.43223 15 7.8125V11.9375C15 13.0762 15.9238 14 17.0625 14H21.1875C22.3262 14 23.25 13.0762 23.25 11.9375H23.5938C24.9236 11.9375 26 10.8611 26 9.53125C26 8.20137 24.9236 7.125 23.5938 7.125H22.5625H15.6875ZM23.25 8.5H23.5938C24.1631 8.5 24.625 8.96191 24.625 9.53125C24.625 10.1006 24.1631 10.5625 23.5938 10.5625H23.25V8.5ZM19.8125 3.51562C19.8125 3.22988 19.5826 3 19.2969 3C19.0111 3 18.7812 3.22988 18.7812 3.51562C18.7812 4.35137 19.284 4.7918 19.6213 5.08613L19.6449 5.10762C19.9951 5.4127 20.1562 5.57598 20.1562 5.92188C20.1562 6.20762 20.3861 6.4375 20.6719 6.4375C20.9576 6.4375 21.1875 6.20762 21.1875 5.92188C21.1875 5.08613 20.6848 4.6457 20.3475 4.35137L20.3238 4.32988C19.9736 4.0248 19.8125 3.86152 19.8125 3.51562Z" fill="#DA9759"/>
                        <path d="M9.03354 18.2857C8.66458 18.2857 8.36667 17.9955 8.36667 17.6361C8.36667 17.5937 8.37125 17.5535 8.38042 17.5111C8.50187 17.0424 9.43917 14 13.5 14C17.5608 14 18.4981 17.0424 18.6196 17.5111C18.631 17.5535 18.6333 17.5937 18.6333 17.6361C18.6333 17.9955 18.3354 18.2857 17.9665 18.2857H9.03354ZM10.9333 16.1428C10.9333 16.0481 10.8947 15.9573 10.8259 15.8903C10.7572 15.8233 10.6639 15.7857 10.5667 15.7857C10.4694 15.7857 10.3762 15.8233 10.3074 15.8903C10.2386 15.9573 10.2 16.0481 10.2 16.1428C10.2 16.2375 10.2386 16.3284 10.3074 16.3954C10.3762 16.4623 10.4694 16.5 10.5667 16.5C10.6639 16.5 10.7572 16.4623 10.8259 16.3954C10.8947 16.3284 10.9333 16.2375 10.9333 16.1428ZM16.4333 16.5C16.5306 16.5 16.6238 16.4623 16.6926 16.3954C16.7614 16.3284 16.8 16.2375 16.8 16.1428C16.8 16.0481 16.7614 15.9573 16.6926 15.8903C16.6238 15.8233 16.5306 15.7857 16.4333 15.7857C16.3361 15.7857 16.2428 15.8233 16.1741 15.8903C16.1053 15.9573 16.0667 16.0481 16.0667 16.1428C16.0667 16.2375 16.1053 16.3284 16.1741 16.3954C16.2428 16.4623 16.3361 16.5 16.4333 16.5ZM13.8667 15.4285C13.8667 15.3338 13.828 15.243 13.7593 15.176C13.6905 15.109 13.5972 15.0714 13.5 15.0714C13.4028 15.0714 13.3095 15.109 13.2407 15.176C13.172 15.243 13.1333 15.3338 13.1333 15.4285C13.1333 15.5233 13.172 15.6141 13.2407 15.6811C13.3095 15.7481 13.4028 15.7857 13.5 15.7857C13.5972 15.7857 13.6905 15.7481 13.7593 15.6811C13.828 15.6141 13.8667 15.5233 13.8667 15.4285ZM8 20.0714C8 19.4799 8.49271 19 9.1 19H17.9C18.5073 19 19 19.4799 19 20.0714C19 20.6629 18.5073 21.1428 17.9 21.1428H9.1C8.49271 21.1428 8 20.6629 8 20.0714ZM8.36667 22.2143C8.36667 22.0178 8.53167 21.8571 8.73333 21.8571H18.2667C18.4683 21.8571 18.6333 22.0178 18.6333 22.2143V22.5714C18.6333 23.3593 17.9756 24 17.1667 24H9.83333C9.02438 24 8.36667 23.3593 8.36667 22.5714V22.2143Z" fill="#DA9759"/>
                        <path d="M10.2267 0.1871C9.83338 0.28064 7.26555 1.71553 8.1004 5.22605L8.74972 7.95645C8.95437 8.81701 9.82631 9.34889 10.6941 9.14252L11.4808 8.95544L12.2229 12.0759C12.3255 12.5074 12.7599 12.7724 13.195 12.6689C13.6302 12.5655 13.8988 12.1332 13.7962 11.7017L13.0541 8.58128L12.4048 5.85088L11.1989 0.780134C11.0963 0.348634 10.6618 0.0836213 10.2267 0.1871ZM1.6661 2.63504C1.61856 2.43513 1.42918 2.30502 1.22238 2.33102C1.01557 2.35702 0.867422 2.53134 0.868973 2.73445L0.914298 6.2344C0.916406 6.39617 0.936302 6.55628 0.973406 6.7123C1.23951 7.83128 2.32096 8.54515 3.44852 8.38261L4.74949 13.8532C4.85211 14.2847 5.28656 14.5497 5.72168 14.4462C6.15681 14.3427 6.42545 13.9105 6.32283 13.479L5.02186 8.00845C6.10189 7.646 6.7462 6.52172 6.4801 5.40274C6.44299 5.24672 6.38868 5.09479 6.31774 4.94939L4.78266 1.80373C4.69203 1.61923 4.47692 1.53387 4.28301 1.60316C4.08911 1.67246 3.97857 1.87389 4.02611 2.0738L4.80414 5.3454C4.83545 5.47705 4.75279 5.61004 4.62004 5.64161C4.49466 5.67142 4.3688 5.6009 4.32694 5.47949L3.22887 2.22733C3.16354 2.02908 2.95739 1.91584 2.75335 1.96436C2.5493 2.01288 2.4162 2.20681 2.44711 2.41324L2.93306 5.81097C2.95034 5.93823 2.8697 6.05786 2.74432 6.08768C2.61157 6.11924 2.47789 6.0377 2.44659 5.90606L1.66856 2.63445L1.6661 2.63504ZM3.73471 6.05821L3.72733 6.05996L3.71996 6.06172L3.72327 6.0429L3.73471 6.05821Z" fill="#50B04E"/>
                    </svg>
                    <span>What did you eat today?</span>
                </div>
            </div>
            <div className="tracking-methods">
                <label className='upload-method'>
                    <div className="track-method-circle">
                        <svg width="36" height="31.2" viewBox="0 0 45 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13.1045 2.85536L12.1904 5.57143H5.625C2.52246 5.57143 0 8.06987 0 11.1429V33.4286C0 36.5016 2.52246 39 5.625 39H39.375C42.4775 39 45 36.5016 45 33.4286V11.1429C45 8.06987 42.4775 5.57143 39.375 5.57143H32.8096L31.8955 2.85536C31.3242 1.14911 29.7158 0 27.8965 0H17.1035C15.2842 0 13.6758 1.14911 13.1045 2.85536ZM22.5 13.9286C24.7378 13.9286 26.8839 14.8091 28.4662 16.3763C30.0486 17.9436 30.9375 20.0693 30.9375 22.2857C30.9375 24.5022 30.0486 26.6278 28.4662 28.1951C26.8839 29.7624 24.7378 30.6429 22.5 30.6429C20.2622 30.6429 18.1161 29.7624 16.5338 28.1951C14.9514 26.6278 14.0625 24.5022 14.0625 22.2857C14.0625 20.0693 14.9514 17.9436 16.5338 16.3763C18.1161 14.8091 20.2622 13.9286 22.5 13.9286Z" fill="#DA9759"/>
                        </svg>
                    </div>
                    <input onChange={(e) => {detectImage(e)}} type="file" style={{position: "absolute", top:0, left:0, bottom:0, right:0, opacity: 0}} />
                </label>
                <div onClick={() => {startRecorder()}} className="track-method-circle">
                    <svg width="21.6" height="31.2" viewBox="0 0 27 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.4398 0C9.39262 0 6.10902 3.27539 6.10902 7.3125V19.5C6.10902 23.5371 9.39262 26.8125 13.4398 26.8125C17.4871 26.8125 20.7707 23.5371 20.7707 19.5V7.3125C20.7707 3.27539 17.4871 0 13.4398 0ZM3.66541 16.4531C3.66541 15.44 2.84833 14.625 1.83271 14.625C0.817082 14.625 0 15.44 0 16.4531V19.5C0 26.2869 5.05522 31.8932 11.6071 32.7844V35.3438H7.94173C6.9261 35.3438 6.10902 36.1588 6.10902 37.1719C6.10902 38.185 6.9261 39 7.94173 39H13.4398H18.938C19.9536 39 20.7707 38.185 20.7707 37.1719C20.7707 36.1588 19.9536 35.3438 18.938 35.3438H15.2726V32.7844C21.8245 31.8932 26.8797 26.2869 26.8797 19.5V16.4531C26.8797 15.44 26.0626 14.625 25.047 14.625C24.0314 14.625 23.2143 15.44 23.2143 16.4531V19.5C23.2143 24.8854 18.8387 29.25 13.4398 29.25C8.041 29.25 3.66541 24.8854 3.66541 19.5V16.4531Z" fill="#DA9759"/>
                    </svg>
                </div>
                <div onClick={() => {setTypingChosen(true)}} className="track-method-circle">
                    <svg width="31.2" height="31.2" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M27.627 1.42822L23.9403 5.11494L33.8426 15.0173L37.5294 11.3306C39.4337 9.42627 39.4337 6.34131 37.5294 4.43701L34.5282 1.42822C32.6239 -0.476074 29.5389 -0.476074 27.6346 1.42822H27.627ZM22.2188 6.83643L4.46314 24.5997C3.67096 25.3919 3.09205 26.3745 2.77213 27.4485L0.0756439 36.612C-0.114786 37.2595 0.0604096 37.9526 0.532675 38.4249C1.00494 38.8972 1.6981 39.0724 2.33795 38.8896L11.5014 36.1931C12.5754 35.8731 13.5581 35.2942 14.3503 34.5021L32.1212 16.7388L22.2188 6.83643Z" fill="#DA9759"/>
                    </svg>
                </div>
            </div>  
            {(loadingFoods) ? <div style={{color: "white"}}>Loading food items</div> : ""}
            <div className="foods" style={{marginTop: "2rem"}}>
                {(loggedFoods) ? loggedFoods.map((foodItem, index) => {
                    return <div key={index} className="shadow-box food">
                        <span onClick={() => { showOverlay("usda", foodItem.scraped_url) }} className='data-origin'>{foodItem.food_origin}</span>
                        <img src="/src/img/lemon.png" alt="" className='food-img' />
                        <div className='food-details'>
                            <span>{foodItem.food_name}</span>
                            <span>{foodItem.amount_in_grams} g</span>
                        </div>
                        <div className="cancel-btn"></div>
                        <div onClick={(e) => { removeLoggedFood(foodItem.food_name, foodItem.amount_in_grams) }} className="remove-btn">
                            <div className="line"></div>
                            <div className="line vertical"></div>
                        </div>
                    </div>
                }) : "Fetching logged foods"}
            </div>
            <div className="recent-foods-container">
                <h3>Recently logged foods</h3>
                <div className="foods">
                    <div className="shadow-box food">
                        <img src="/src/img/lemon.png" alt="" className='food-img' />
                        <div className='food-details'>
                            <span>Apple</span>
                            <span>{"200"} g</span>
                        </div>
                        <span className="prim-btn">ADD</span>
                    </div>
                    <div className="shadow-box food">
                        <img src="/src/img/lemon.png" alt="" className='food-img' />
                        <div className='food-details'>
                            <span>Apple</span>
                            <span>{"200"} g</span>
                        </div>
                        <span className="prim-btn">ADD</span>
                    </div>
                </div>
            </div>
            <NavBar />
        </div>
        {(overlayContent.value) ? <Overlay /> : ""}
        {(foodChosen.value) ? <FoodChoice /> : ""}
    </>
}