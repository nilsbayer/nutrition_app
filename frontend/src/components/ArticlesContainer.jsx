import { useState } from "react"
import { useAuthUser } from "react-auth-kit"
import { notfiyUser } from "../Notifcation"
import { Link } from "react-router-dom"

export function ArticlesContainer () {
    const auth = useAuthUser()
    const user = auth()

    const [ loading, setLoading ] = useState(true)
    const [ articles, setArticles ] = useState(() => {
        fetchArticles()
        .then(data => {
            console.log(data)
            if (data.msg) { 
                console.log(data.articles)
                setArticles(data.articles)
                setLoading(false)
            }
            else {
                notfiyUser("Articles were not able to be loaded.")
            }
        })
    })

    async function fetchArticles() {
        const response = await fetch(window.location.origin+'/api/get-article-recommendations', {
            method: "GET",
            credentials: "same-origin"
        })
        const data = await response.json();
        return data;
    }


    if (loading) {
        return <div className="shadow-box recipe-box">
            <div className="recipe-header" id="article-header">
                <h3>Curated Articles for you</h3>
            </div>
            <div className="loading-container" style={{paddingTop: "2rem"}}>
                <div className="loading-circle"></div>
                <span>Articles are being loaded</span>
            </div>
        </div>
    }

    return <div className="shadow-box recipe-box">
        <div className="recipe-header" id="article-header">
            <h3>Curated Articles for you</h3>
        </div>
        
        <div className="recommended-foods">
            {articles.map((article, idx) => {
                return <Link to={window.location.origin+`/article/${article.token}`} key={idx}>
                <div className="shadow-box recipe-box article-card">
                    <div className="recipe-header">
                        <span>{article.title}</span>
                    </div>
                    <p className="article-short">
                        {article.text.slice(0, 200)}...
                    </p>
                    <div className="article-footer">
                        <span>Written by</span>
                        <img src="/src/img/Nils.png" style={{height: "60%"}} />
                        <span>Nils Bayer</span>
                    </div>
                </div>  
                </Link>
            })}
        </div>
    </div>
}