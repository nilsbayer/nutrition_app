import {useAuthUser} from 'react-auth-kit'
import { Link } from 'react-router-dom';
import React, { useState } from 'react'
import { user_vector } from '../App'

export function Dashboard () {
    // const auth = useAuthUser()
    // const user = auth()
    const user = {
        name: "Maria"
    }

    console.log("User vector", user_vector.value)

    const nutrientData = {
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
    }

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
            <div className="navbar">
                <Link to={"/"}>
                    <svg width="37" height="34" viewBox="0 0 37 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M36.9903 16.9668C36.9903 18.1621 36.0267 19.0984 34.9346 19.0984H32.8788L32.9238 29.7367C32.9238 29.916 32.911 30.0953 32.8917 30.2746V31.3438C32.8917 32.8113 31.7418 34 30.322 34H29.2942C29.2235 34 29.1528 34 29.0822 33.9934C28.9922 34 28.9023 34 28.8123 34H26.7245H25.1827C23.763 34 22.613 32.8113 22.613 31.3438V29.75V25.5C22.613 24.3246 21.6944 23.375 20.5573 23.375H16.4458C15.3088 23.375 14.3901 24.3246 14.3901 25.5V29.75V31.3438C14.3901 32.8113 13.2402 34 11.8205 34H10.2787H8.22935C8.13298 34 8.03662 33.9934 7.94026 33.9867C7.86317 33.9934 7.78608 34 7.70899 34H6.68112C5.26139 34 4.11146 32.8113 4.11146 31.3438V23.9062C4.11146 23.8465 4.11146 23.7801 4.11789 23.7203V19.0984H2.05573C0.899382 19.0984 0 18.1688 0 16.9668C0 16.3691 0.192725 15.8379 0.642416 15.373L17.114 0.53125C17.5636 0.0664062 18.0776 0 18.5273 0C18.977 0 19.4909 0.132812 19.8763 0.464844L36.2836 15.373C36.7976 15.8379 37.0545 16.3691 36.9903 16.9668Z" fill="white"/>
                    </svg>
                </Link>
                <Link to={"/"}>
                <svg width="41" height="34" viewBox="0 0 41 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.3262 23.375C20.6872 23.375 26.6516 18.1422 26.6516 11.6875C26.6516 5.23281 20.6872 0 13.3262 0C5.96512 0 0.000701154 5.23281 0.000701154 11.6875C0.000701154 14.2508 0.942452 16.6215 2.53766 18.5539C2.31344 19.1781 1.9803 19.7293 1.62794 20.1941C1.32043 20.6059 1.00652 20.9246 0.775884 21.1437C0.660567 21.25 0.56447 21.3363 0.500406 21.3895C0.468373 21.416 0.442747 21.4359 0.429934 21.4426L0.417122 21.4559C0.0647658 21.7281 -0.0889894 22.2062 0.0519529 22.6379C0.192895 23.0695 0.58369 23.375 1.02574 23.375C2.42235 23.375 3.83177 23.0031 5.00415 22.5449C5.59355 22.3125 6.1445 22.0535 6.62499 21.7879C8.59177 22.7973 10.8789 23.375 13.3262 23.375ZM28.7017 11.6875C28.7017 19.1449 22.3529 24.7629 14.8317 25.4336C16.3884 30.3742 21.5521 34 27.6766 34C30.1239 34 32.411 33.4223 34.3842 32.4129C34.8647 32.6785 35.4092 32.9375 35.9986 33.1699C37.171 33.6281 38.5804 34 39.9771 34C40.4191 34 40.8163 33.7012 40.9508 33.2629C41.0854 32.8246 40.938 32.3465 40.5793 32.0742L40.5665 32.0609C40.5536 32.0477 40.528 32.0344 40.496 32.0078C40.4319 31.9547 40.3358 31.875 40.2205 31.7621C39.9899 31.543 39.676 31.2242 39.3684 30.8125C39.0161 30.3477 38.6829 29.7898 38.4587 29.1723C40.0539 27.2465 40.9957 24.8758 40.9957 22.3059C40.9957 16.1434 35.5566 11.0898 28.6568 10.6516C28.6825 10.9902 28.6953 11.3355 28.6953 11.6809L28.7017 11.6875Z" fill="white"/>
                </svg>
                </Link>
                <Link to={"/"}>
                    <svg width="32" height="34" viewBox="0 0 32 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M31.9113 11.0654C32.1235 11.6433 31.9445 12.2876 31.4869 12.6994L28.6156 15.3163C28.6886 15.8676 28.7284 16.4321 28.7284 17.0033C28.7284 17.5745 28.6886 18.1391 28.6156 18.6904L31.4869 21.3073C31.9445 21.7191 32.1235 22.3634 31.9113 22.9412C31.6195 23.7316 31.2681 24.4888 30.8636 25.2194L30.5519 25.7574C30.1143 26.488 29.6236 27.1787 29.0865 27.8297C28.6952 28.3079 28.0454 28.4673 27.4618 28.2813L23.7683 27.1057C22.8798 27.7898 21.8984 28.361 20.8506 28.7927L20.0218 32.5853C19.8891 33.1897 19.425 33.6679 18.8149 33.7675C17.8998 33.9203 16.9582 34 15.9967 34C15.0352 34 14.0936 33.9203 13.1785 33.7675C12.5684 33.6679 12.1042 33.1897 11.9716 32.5853L11.1427 28.7927C10.095 28.361 9.11362 27.7898 8.22505 27.1057L4.53817 28.2879C3.95463 28.4739 3.30478 28.3079 2.91355 27.8363C2.37643 27.1854 1.88573 26.4946 1.44808 25.764L1.13642 25.226C0.731923 24.4954 0.380476 23.7382 0.0887078 22.9478C-0.123487 22.37 0.0555524 21.7257 0.513097 21.3139L3.38436 18.697C3.31142 18.1391 3.27163 17.5745 3.27163 17.0033C3.27163 16.4321 3.31142 15.8676 3.38436 15.3163L0.513097 12.6994C0.0555524 12.2876 -0.123487 11.6433 0.0887078 11.0654C0.380476 10.2751 0.731923 9.51787 1.13642 8.78726L1.44808 8.24927C1.88573 7.51866 2.37643 6.8279 2.91355 6.17699C3.30478 5.69877 3.95463 5.53936 4.53817 5.72534L8.23168 6.90096C9.12025 6.21684 10.1016 5.64563 11.1494 5.21391L11.9782 1.42137C12.1109 0.816956 12.575 0.338738 13.1851 0.239109C14.1002 0.0797031 15.0418 0 16.0033 0C16.9648 0 17.9064 0.0797031 18.8215 0.232467C19.4316 0.332096 19.8958 0.810314 20.0284 1.41473L20.8573 5.20727C21.905 5.63899 22.8864 6.2102 23.775 6.89432L27.4685 5.71869C28.052 5.53272 28.7018 5.69877 29.0931 6.17035C29.6302 6.82125 30.1209 7.51201 30.5586 8.24263L30.8702 8.78062C31.2747 9.51123 31.6262 10.2684 31.9179 11.0588L31.9113 11.0654ZM16.0033 22.3169C17.4103 22.3169 18.7596 21.757 19.7544 20.7606C20.7493 19.7641 21.3082 18.4126 21.3082 17.0033C21.3082 15.5941 20.7493 14.2426 19.7544 13.2461C18.7596 12.2496 17.4103 11.6898 16.0033 11.6898C14.5964 11.6898 13.2471 12.2496 12.2522 13.2461C11.2574 14.2426 10.6984 15.5941 10.6984 17.0033C10.6984 18.4126 11.2574 19.7641 12.2522 20.7606C13.2471 21.757 14.5964 22.3169 16.0033 22.3169Z" fill="white"/>
                    </svg>
                </Link>
            </div>
        </>
    }
}