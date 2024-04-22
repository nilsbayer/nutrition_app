import {useAuthUser} from 'react-auth-kit'
import { Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react'
import { user_vector, userRecommendationVector } from '../App'
import { NavBar } from '../components/NavBar';

export function Dashboard () {
    // const auth = useAuthUser()
    // const user = auth()
    const user = {
        name: "Maria"
    }

    console.log("User vector", user_vector.value)

    const [ nutrientData, setNutrientData ] = useState({
        microNutrients: [
        {
            name: "Vitamin C",
            percentage: 65
        },
        {
            name: "Vitamin B",
            percentage: 45
        },
        {
            name: "Vitamin D",
            percentage: 100
        },
        {
            name: "Potassium",
            percentage: 89
        },
        {
            name: "Vitamin A",
            percentage: 67
        },
        {
            name: "Thiamin",
            percentage: 23
        },
        ],
        macroNutrients: [
            {
                name: "Protein",
                percentage: 20
            },
            {
                name: "Fats",
                percentage: 30
            },
            {
                name: "Carbohydrates",
                percentage: 45
            }
        ],
        remainingCalories: 1100
    })

    useEffect(() => {
        let newDict = []
        for (let key in user_vector.value) {
            newDict.push({
                name: key.charAt(0).toUpperCase() + key.slice(1),
                percentage: parseInt(Math.abs((user_vector.value[key] / userRecommendationVector[key] * 100) -100)) 
            })
        }
        setNutrientData((currentData) => {
            return {
                ...currentData,
                microNutrients: newDict
            }
        })
        console.log("Changed these values", newDict)
    }, [user_vector.value])

    const [ loading, setLoading ] = useState(true)
    const [ foodRecommendations, setFoodRecommendations ] = useState(() => {
        fetchRecommendations({user_vector: user_vector.value})
        .then(data => {
            if (data.msg) {
                setLoading(false)
                setFoodRecommendations(data.recommendations)
            }
            else {
                console.log("BACKEND ISSUE")
            }
        })
    })


    async function fetchRecommendations (dataToSend) {
        const response = await fetch(window.location.origin+'/api/get-food-recommendations', {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dataToSend)
        });
        const data = await response.json();
        return data;
    }

    if (loading) {
        return "Loading foods and stuff..."
    }
    else {
        return <>
            <div className="content-container">
                <h1>Hey {user.name}</h1>
                <div className="shadow-box">
                    <div className="emoji-text">
                        <span>SVG</span>
                        <span>How have you felt today?</span>
                    </div>
                </div>

                <Link onClick={(e) => { window.location.href = window.location.origin+"/track-foods/" }}>
                    <div className="shadow-box">
                        <div className="emoji-text">
                            <span>SVG</span>
                            <span>What have you eaten today?</span>
                        </div>
                    </div>
                </Link>

                <div className="shadow-box">
                    <div className="emoji-text">
                        <span>SVG</span>
                        <h3>Your nutrient profile</h3>
                    </div>
                    <div className="progress-bar-container">
                        <div className="progressbar">
                            <div className="progress" style={{width: "20%"}}></div>
                        </div>
                        <p className="progress-info">65% of recommended amounts consumed</p>
                    </div>
                    <h4>Micronutrient Overview</h4>
                    <div className="nutrient-overview">
                        {nutrientData.microNutrients.map((nutrient) => {
                            return <div className="nutrient">
                                <span>{nutrient.name}</span>
                                <div className="progressbar">
                                    <div className="progress" style={{width: `${nutrient.percentage}%`, backgroundColor: (nutrient.percentage > 79) ? "#50B04E" : (nutrient.percentage < 30) ? "darkred" : "orange"}}></div>
                                </div>
                        </div>
                        })}
                    </div>
                    <h4>Macronutrient Overview</h4>
                    <div className="nutrient-overview">
                        {nutrientData.macroNutrients.map((nutrient) => {
                            return <div className="nutrient">
                                <span>{nutrient.name}</span>
                                <div className="progressbar">
                                    <div className="progress" style={{width: `${nutrient.percentage}%`, backgroundColor: (nutrient.percentage > 79) ? "#50B04E" : (nutrient.percentage < 30) ? "darkred" : "orange"}}></div>
                                </div>
                        </div>
                        })}
                    </div>
                </div>
                <div className="shadow-box">
                    <div className="emoji-text">
                        <span>SVG</span>
                        <h3>Foods to satify your nutrient needs</h3>
                    </div>
                    <div className="recommended-foods">
                        {foodRecommendations.map((food) => {
                            return <div className="shadow-box food-card">
                                <img width={{width: "80%"}} src="/src/img/lemon.png" />
                                <span>{food.name}</span>
                                <div className="rich-in-container">
                                    {food.richIn.map(item => {
                                        return <span className="rich-in">{item}</span>
                                    })}
                                </div>
                            </div>
                        })}
                    </div>
                </div>
                <div className="shadow-box recipe-box">
                    <div className="recipe-header">
                        <h3>Recommendations for your taste</h3>
                    </div>
                    <p>Based on your food preferences, we have put together a collection of recipes for you today</p>
                    <p>Check them out now {">>>"}</p>
                </div>
            </div>
            <NavBar />
        </>
    }
}