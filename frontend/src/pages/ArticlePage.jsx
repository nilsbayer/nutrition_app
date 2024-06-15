import { useLayoutEffect, useRef, useState } from 'react';
import { NavBar } from '../components/NavBar';
import { v4 as uuidv4 } from 'uuid';
import { notfiyUser } from '../Notifcation';
import {useAuthUser} from 'react-auth-kit'
import { useParams } from 'react-router-dom';

export function ArticlePage() {
    const auth = useAuthUser()
    const user = auth()

    const params = useParams()
    const [ loading, setLoading ] = useState(true)
    const [ currentArticle, setCurrentArticle ] = useState(() => {
        fetchArticle(params.articleToken)
        .then(data => {
            if (data.msg) {
                setCurrentArticle(data.article)
                setLoading(false)
            }
            else {
                notfiyUser("Sorry, but this article was unable to be loaded.")
            }
        })
    })

    async function fetchArticle (articleToken) {
        const response = await fetch(window.location.origin+'/api/get-article?t='+articleToken, {
            method: "GET",
            credentials: "same-origin"
        })
        const data = await response.json();
        return data;
    }

    if (loading) {
        return <>
            <div className="content-container">
                <span>Article is being loaded</span>
            </div>
            <NavBar />
        </>
    }

    return <>
        <div className="content-container">
            <h1>{currentArticle.title}</h1>
            <p style={{color: "white", textHeight: "2rem"}}>
                {currentArticle.text}
            </p>
        </div>
        <NavBar />
    </>
}