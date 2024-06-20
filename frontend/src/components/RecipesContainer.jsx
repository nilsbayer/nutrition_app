import { useState } from "react"
import { useAuthUser } from "react-auth-kit"
import { notfiyUser } from "../Notifcation"
import { Link } from "react-router-dom"

export function RecipesContainer () {
    const auth = useAuthUser()
    const user = auth()

    const [ loading, setLoading ] = useState(true)
    const [ recipes, setRecipes ] = useState(() => {
        fetchArticles()
        .then(data => {
            console.log(data)
            if (data.msg) { 
                console.log("RECIPES", data.recipes)
                setRecipes(data.recipes)
                setLoading(false)
            }
            else {
                notfiyUser("Recipes were not able to be loaded.")
            }
        })
    })

    async function fetchArticles() {
        const response = await fetch(window.location.origin+'/api/get-recipe-recommendations', {
            method: "GET",
            credentials: "same-origin"
        })
        const data = await response.json();
        return data;
    }


    if (loading) {
        return <div className="shadow-box recipe-box">
            <div className="recipe-header" id="recipe-header">
                <h3>Inspiring Recipes</h3>
            </div>
            <div className="loading-container" style={{paddingTop: "2rem"}}>
                <div className="loading-circle"></div>
                <span>Recipes are being loaded</span>
            </div>
        </div>
    }

    return <div className="shadow-box recipe-box">
        <div className="recipe-header" id="recipe-header">
            <h3>Inspiring Recipes</h3>
        </div>
        
        <div className="recommended-foods">
            {recipes.map((recipe, idx) => {
                // return <Link to={window.location.origin+`/recipe/${""}`} key={idx}>
                return <div key={idx} className="shadow-box recipe-box article-card">
                    <div className="recipe-header" id="recipe-pic">
                        <span>{recipe.name}</span>
                    </div>
                    <div className="article-short">
                        {recipe.items.map((ingredient, idx2) => {
                            return <p key={idx2} style={{padding: "2dvh 5dvw"}}>
                                {ingredient.amount} grams {ingredient.name}
                            </p>
                        })}
                    </div>
                    <div className="article-footer">
                        <span>Crafted by</span>
                        <img src="/src/img/Nils.png" style={{height: "60%"}} />
                        <span>Nils Bayer</span>
                    </div>
                </div>  
                {/* </Link> */}
            })}
        </div>
    </div>
}