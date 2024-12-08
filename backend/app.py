# from sentence_transformers import SentenceTransformer, util
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_bcrypt import Bcrypt
import uuid
import json
import os
import jwt
import pymongo
import base64
from datetime import datetime, timedelta
import urllib.parse
import logging
from sentence_transformers import util, SentenceTransformer
from uuid import uuid4
from openai import OpenAI
from ragas import evaluate
from datasets import Dataset
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_precision,
    context_recall,
    answer_similarity,
    answer_correctness,
)
import pandas as pd
import numpy as np
from bson import ObjectId, BSON
import torch
import re
import statistics

app = Flask(__name__, static_url_path="/")
CORS(app, origins=['http://localhost:3000'])
bcrypt = Bcrypt(app)

app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY_APP")
enc_key = os.environ.get("ENC_KEY")

# Load OpenAI client
openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Load database
myclient1 = pymongo.MongoClient(os.environ.get("DB_PAPERS"))
db1 = myclient1["papers"]
paper_col = db1["paper_embeds"]

myclient = pymongo.MongoClient(os.environ.get("DB_URI"))
db = myclient["foods"]
nutrient_col = db["nutrient_data"]
means_stds_col = db["means_stds"]
user_col = db["users"]
chatbot_logs_col = db["chatbot_logs_normal"]
user_logs_col = db["user_logs"]
articles_col = db["articles"]
recipes_col = db["recipes"]

sbert = SentenceTransformer("all-MiniLM-L6-v2")

# yolo_model = torch.hub.load('ultralytics/yolov5', 'custom', path='best.pt', force_reload=True)
llm_for_detection = True

logging.basicConfig(level=logging.DEBUG)

yolo_classes = [
    'dog', 'person', 'cat', 'tv', 'car', 'meatballs', 'marinara sauce', 'tomato soup', 'chicken noodle soup', 'french onion soup', 'chicken breast', 'ribs', 'pulled pork', 'hamburger', 'cavity', 'banana', 'blueberry', 'w', 'raspberry', 'strawberry'
]

"********************** Create vectors **********************"
# All numbers saved as micrograms

list_nutrient_names = [
    "vitamin b-12",
    "vitamin a",
    "vitamin b-6",
    "niacin",
    "riboflavin (vitamin b-2)",
    "thiamin (vitamin b-1)",
    "vitamin c (ascorbic acid)",
    "sodium",
    "potassium",
    "phosphorus",
    "magnesium",
    "iron",
    "calcium",
    "total_fiber",
    "vitamin e",
    "vitamin k",
    "cholesterol"
]

who_recommedations_male = {
    "vitamin b-12": 2.4,
    "vitamin a": 800.0,
    "vitamin b-6": 1500.0,
    "niacin": 15000.0,
    "riboflavin (vitamin b-2)": 1200.0,
    "thiamin (vitamin b-1)": 1150.0,
    "vitamin c (ascorbic acid)": 82500.0,
    "sodium": 2000000.0,
    "potassium": 4100000.0,
    "phosphorus": 700000.0,
    "magnesium": 410000.0,
    "iron": 8000.0,
    "calcium": 1000000.0,
    "total_fiber": 38000000.0,
    "vitamin e": 15000.0,
    "vitamin k": 105.0,
    "cholesterol": 300.0
}

who_recommedations_female = {
    "vitamin b-12": 2.4,                    # ALL
    "vitamin a": 800.0,                     # ALL
    "vitamin b-6": 1500.0,                  # ALL
    "niacin": 15000.0,                      # ALL
    "riboflavin (vitamin b-2)": 1200.0,     # ALL
    "thiamin (vitamin b-1)": 1150.0,        # ALL
    "vitamin c (ascorbic acid)": 82500.0,   # ALL
    "sodium": 2000000.0,                    # ALL
    "potassium": 4100000.0,                 # ALL
    "phosphorus": 700000.0,                 # ALL
    "magnesium": 315000.0,                  # ALL
    "iron": 18000.0,                        # ALL
    "calcium": 1000000.0,                   # ALL
    "total_fiber": 25000000.0,              # ALL
    "vitamin e": 15000.0,                   # ALL
    "vitamin k": 105.0,                     # ALL
    "cholesterol": 300.0                    # ALL
}

male_recommendation_vector = [value for key, value in who_recommedations_male.items()]
female_recommendation_vector = [value for key, value in who_recommedations_female.items()]

# food_names = []
# nutrient_vectors = []

unit_table = {
    "µg": 1.0,
    "mg": 1000.0,
    "g": 1000000.0
}

# for food in nutrient_col.find():
#     this_food_dict = {}
#     for i in food.get("nutrients"):
#         if i.get("nutrient") == "Vitamin B-12":
#             this_food_dict.update({"vitamin b-12": i.get("amount") * unit_table.get(i.get("unit"))})
#         if i.get("nutrient") == "Vitamin A, RAE":
#             this_food_dict.update({"vitamin a": i.get("amount") * unit_table.get(i.get("unit"))})
#         if i.get("nutrient") == "Vitamin B-6":
#             this_food_dict.update({"vitamin b-6": i.get("amount") * unit_table.get(i.get("unit"))})
#         if i.get("nutrient") == "Niacin":
#             this_food_dict.update({"niacin": i.get("amount") * unit_table.get(i.get("unit"))})
#         if i.get("nutrient") == "Riboflavin":
#             this_food_dict.update({"riboflavin (vitamin b-2)": i.get("amount") * unit_table.get(i.get("unit"))})
#         if i.get("nutrient") == "Thiamin":
#             this_food_dict.update({"thiamin (vitamin b-1)": i.get("amount") * unit_table.get(i.get("unit"))})
#         if i.get("nutrient") == "Vitamin C, total ascorbic acid":
#             this_food_dict.update({"vitamin c (ascorbic acid)": i.get("amount") * unit_table.get(i.get("unit"))})
#         if i.get("nutrient") == "Sodium, Na":
#             this_food_dict.update({"sodium": i.get("amount") * unit_table.get(i.get("unit"))})
#         if i.get("nutrient") == "Potassium, K":
#             this_food_dict.update({"potassium": i.get("amount") * unit_table.get(i.get("unit"))})
#         if i.get("nutrient") == "Phosphorus, P":
#             this_food_dict.update({"phosphorus": i.get("amount") * unit_table.get(i.get("unit"))})
#         if i.get("nutrient") == "Magnesium, Mg":
#             this_food_dict.update({"magnesium": i.get("amount") * unit_table.get(i.get("unit"))})
#         if i.get("nutrient") == "Iron, Fe":
#             this_food_dict.update({"iron": i.get("amount") * unit_table.get(i.get("unit"))})
#         if i.get("nutrient") == "Calcium, Ca":
#             this_food_dict.update({"calcium": i.get("amount") * unit_table.get(i.get("unit"))})
#         if i.get("nutrient") == "Fiber, total dietary":
#             this_food_dict.update({"total_fiber": i.get("amount") * unit_table.get(i.get("unit"))})
#         if i.get("nutrient") == "Fiber, total dietary":
#             this_food_dict.update({"total_fiber": i.get("amount") * unit_table.get(i.get("unit"))})
#         if i.get("nutrient") == "Vitamin E (alpha-tocopherol)":
#             this_food_dict.update({"vitamin e": i.get("amount") * unit_table.get(i.get("unit"))})
#         if i.get("nutrient") == "Vitamin K (phylloquinone)":
#             this_food_dict.update({"vitamin k": i.get("amount") * unit_table.get(i.get("unit"))})
#         if i.get("nutrient") == "Cholesterol":
#             this_food_dict.update({"cholesterol": i.get("amount") * unit_table.get(i.get("unit"))})

#     food_vector = [
#         this_food_dict.get("vitamin b-12"),
#         this_food_dict.get("vitamin a"),
#         this_food_dict.get("vitamin b-6"),
#         this_food_dict.get("niacin"),
#         this_food_dict.get("riboflavin (vitamin b-2)"),
#         this_food_dict.get("thiamin (vitamin b-1)"),
#         this_food_dict.get("vitamin c (ascorbic acid)", 0.0),
#         this_food_dict.get("sodium"),
#         this_food_dict.get("potassium"),
#         this_food_dict.get("phosphorus"),
#         this_food_dict.get("magnesium"),
#         this_food_dict.get("iron"),
#         this_food_dict.get("calcium"),
#         this_food_dict.get("total_fiber"),
#         this_food_dict.get("vitamin e"),
#         this_food_dict.get("vitamin k"),
#         this_food_dict.get("cholesterol")
#     ]

#     food_names.append(food.get("food"))
#     nutrient_vectors.append(food_vector)

# vector_length_sum = 0
# for i in nutrient_vectors:
#     vector_length_sum += len(i)

# app.logger.info(f"RECOMMENDATION LENGTH {str(len(female_recommendation_vector))}")
# app.logger.info(f"AVG FOOD VECTOR LENGTH {str(vector_length_sum / len(nutrient_vectors))}")
# app.logger.info(util.cos_sim(female_recommendation_vector, nutrient_vectors))


"********************** Authentication function **********************"
# Often used functions
def authenticate_cookies(request):
    auth_state = request.cookies.get('_auth_state')
    auth_token = request.cookies.get('_auth')
    
    if auth_state:
        user_email = json.loads(urllib.parse.unquote(auth_state)).get("email")
        if jwt.decode(auth_token, enc_key, algorithms=["HS256"]).get("email") != user_email:
            return [False, "_"]
        
        user = user_col.find_one({ "email": user_email })
        # app.logger.info(user)
        if user != None:
            return [True, user]
        else:
            return [False, "_"]
        
    else:
        return [False, "_"]


def run_query_and_evaluat_web_app(query, db_res):
    if not query: return "Error, please enter query and ground_truth"
    # Embed query
    print("Embedding query")
    query_embed = sbert.encode(query)

    print("Vector search")
    # Vector search in MongoDB vector index
    pipeline = [
        {
            '$vectorSearch': {
                'index': 'vector_index',
                'path': 'sbert_embedding', 
                'queryVector': query_embed.tolist(), 
                'numCandidates': 200, 
                'limit': 5
            }
        }
    ]
    result = [i.get("text") for i in paper_col.aggregate(pipeline)]

    print("Prompting LLM")
    # Query LLM with context docs
    llm_query = f"""
    You are an expert in nutrition science and you are implemented as a chatbot in a nutrition app, helping users to track their diet and learn more about nutrition.
    A user asked a question to you and we found the following relevant information from academic papers on nutrition and health science:
    {" // ".join(result)}

    User question: {query}
    """

    app.logger.info(f"************* CONVERSATION: {str(db_res)}")
    if db_res and db_res.get("conversation"):
        messages = [{"role": chat_item.get("role"), "content": chat_item.get("text")} for chat_item in db_res.get("conversation")]
        messages.append({
            "role": "user",
            "content": llm_query
        })

        llm_res = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0,
            max_tokens=2000,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0
        )
    else:
        llm_res = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                "role": "user",
                "content": llm_query
                }
            ],
            temperature=0,
            max_tokens=2000,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0
        )

    print("RAGAS evaluation started")
    # Prepare data format for RAGAS
    df = pd.DataFrame([[query, result, llm_res.choices[0].message.content]], columns=["question", "contexts", "answer"])
    eval_data = Dataset.from_dict(df)
    ragas_result = evaluate(
        dataset=eval_data,
        metrics=[
            faithfulness
        ]
    )
    return llm_res.choices[0].message.content, ragas_result.get("faithfulness")

def encode_image(image_path):
  with open(image_path, "rb") as image_file:
    return base64.b64encode(image_file.read()).decode('utf-8')

def get_openai_embedding(text, model="text-embedding-3-small"):
   text = text.replace("\n", " ")
   return openai_client.embeddings.create(input = [text], model=model).data[0].embedding

def harris_benedict_formula(sex, weight, height, age, physical_activity):
    if sex == "male":
        bmr = 66.0 + (13.7 * float(weight)) + (5.0 * float(height)) - (6.8 * float(age))
    elif sex == "female":
        bmr = 655.0 + (9.6 * float(weight)) + (1.8 * float(height)) - (4.7 * float(age))
    final_cal = bmr * physical_activity

    return final_cal

"***************************** Routes *****************************"

@app.route("/api/login", methods=["POST"])
def login():
    if request.method == "POST":
        if request.get_json().get("email") and request.get_json().get("password"):
            user_email = request.get_json().get("email")
            user_pwd = request.get_json().get("password")

            user = user_col.find_one({ "email": user_email })
            if user != None:

                is_valid = bcrypt.check_password_hash(user.get("password"), user_pwd)

                if is_valid:
                    encoded = jwt.encode({"email": user_email}, enc_key, algorithm="HS256")

                    return jsonify({
                        "msg": "success",
                        "token": encoded,
                        "email": str(user_email),
                        "name": user.get("name"),
                        "recent_foods": user.get("recent_foods")
                    })
            else:
                return jsonify({"msg": "error", "details": "user not found"})
    return jsonify({"msg": "error"})

# INSTEAD CREATE A CHANGE PASSWORD SITE
# @app.route("/api/signup", methods=["POST"])
# def signup():
#     if request.method == "POST":
#         if request.get_json().get("email") and request.get_json().get("password") and request.get_json().get("fullname") and request.get_json().get("iban"):
#             user_email = request.get_json().get("email")
#             user_pwd = request.get_json().get("password")
#             user_fullname = request.get_json().get("fullname")
#             iban = request.get_json().get("iban")

#             # Check whether user with email address already exists
#             if nutrient_col.find_one({ "email": user_email }) != None:
#                 return jsonify({ "msg": "Ya hay una cuenta con este correo electronico." })

#             # Create new user instance
#             encoded_pwd = bcrypt.generate_password_hash(user_pwd).decode('utf-8')

#             # Check whether UUID is already given
#             while True:
#                 this_uuid = str(uuid.uuid1())
#                 if nutrient_col.find_one({ "id": this_uuid }) == None:
#                     break

#             # Stripe account creation
#             # account = stripe.Account.create(type="express")
#             # account = {
#             #     "id": None
#             # }
#             # Create new user object/dictionary
#             new_user = {
#                 "id": this_uuid,
#                 "fullName": user_fullname,
#                 "email": user_email,
#                 "verifiedEmail": False,
#                 "password": encoded_pwd,
#                 "signupDate": datetime.now(),
#                 "iban": iban,
#                 # "stripe_account": account.get("id"),
#                 "stripe_account": None,
#                 "commission": 0.2,
#                 "prices": {
#                     "single": 5.0,
#                     "all": 20.0
#                 },
#                 "customers": []
#             }
#             # Add new user entry in database
#             nutrient_col.insert_one(new_user)

#             # Create Stripe account setup page link
#             # account_link = stripe.AccountLink.create(
#             #     account=account.get("id"),
#             #     refresh_url="http://localhost/?refreshed=true",
#             #     return_url="http://localhost/",
#             #     type="account_onboarding",
#             # )

#             # Send token and user's email to frontend for login
#             encoded = jwt.encode({"email": user_email}, enc_key, algorithm="HS256")

#             return jsonify({
#                 "msg": "success",
#                 "token": encoded,
#                 "email": user_email
#                 # "stripeAccountLink": account_link.get("url")
#             })
#         return jsonify({"msg": "Algo salió mal."})
#     return jsonify({"msg": "Algo salió mal."})

@app.route("/api/get-food-recommendations", methods=["GET"])
def get_food_recommendations():
    status, user = authenticate_cookies(request)
    if status:
        if request.method == "GET":
            # user_vector = request.get_json().get("user_vector")
            # user_vector = [float(value) for key, value in user_vector.items()]

            # scores = util.cos_sim(user_vector, nutrient_vectors).tolist()[0]
            # sorted_indexes = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
            # top_five_indexes = sorted_indexes[:5]
            
            # Get todays, current nutrient vector of user from user_logs_col
            todays_entry = user_logs_col.find_one({
                "date": str(datetime.today())[:10],
                "user_id": user.get("_id")
            })

            if todays_entry and len(todays_entry.get("logged_foods")) > 0:
                if user.get("sex") == "female":
                    user_vector = [max([0.0, (a - b)]) for a, b in zip(female_recommendation_vector, todays_entry.get("nutrient_vector"))]
                else:
                    user_vector = [max([0.0, (a - b)]) for a, b in zip(male_recommendation_vector, todays_entry.get("nutrient_vector"))]
                
            else:
                # No foods consumed today 
                if user.get("sex") == "female":
                    user_vector = female_recommendation_vector
                else:
                    user_vector = male_recommendation_vector

            if len(user_vector) != 17:
                return jsonify({"msg": False, "vector": user_vector})
            
            # Standardization of user vector
            res = means_stds_col.find_one()
            std_user_vector = np.nan_to_num(((np.array(user_vector) - np.array(res.get("means"))) / np.array(res.get("stds"))), nan=0).tolist()

            # Make 
            pipeline = [
                {
                    '$vectorSearch': {
                        'index': 'food_recommendation_search',
                        'path': 'std_nutrient_vector', 
                        'queryVector': std_user_vector,
                        'numCandidates': 200, 
                        'limit': 10
                    }
                }
            ]
            results = [i for i in nutrient_col.aggregate(pipeline)]

            recommendations_to_send = []
            for i in results:
                recommendations_to_send.append({
                    "name": i.get("food"),
                    "richIn": [
                        "+ Vitamin A", "+ Vitamin C", "+ Potassium"
                    ]
                })
                
            return jsonify({"msg": True, "recommendations": recommendations_to_send})

    return jsonify({"msg": False, "details": "auth"})

@app.route("/api/speech-to-foods", methods=["POST"])
def speech_to_foods():
    status, user = authenticate_cookies(request)
    if status:
        recording = request.files.get("recording")
        if recording.filename == '':
            return jsonify({"msg": False, "details": "No file"})
        
        new_filename = str(uuid4())
        recording.save(os.path.join("data", new_filename+".webm"))

        # Run Whisper
        audio_file= open(os.path.join("data", new_filename+".webm"), "rb")
        transcription = openai_client.audio.transcriptions.create(
            model="whisper-1", 
            file=audio_file
        )
        response_text = transcription.text

        # Delete audio file
        os.remove(os.path.join("data", new_filename+".webm"))

        if len(response_text) > 0:
            # RUN FOOD EXTRACTION
            final_prompt = f"""\
            You are a food expert. Please extract the ingredients from the foods as well as their estimated amounts, measured in grams, from the text below. 
            Split dishes into the single ingredients. For example, if the user says 'hamburger', please split it into probable ingredients, like 'burger bun', 'beef patty', 'lettuce' and 'onions'.
            Please respond with a JSON array where each item is an object with the key ingredient and amount_in_grams.
            Text: {response_text}
            """
            response = openai_client.chat.completions.create(
                model="gpt-3.5-turbo-16k",
                messages=[
                    {
                    "role": "user",
                    "content": final_prompt
                    }
                ],
                temperature=0,
                max_tokens=5000,
                top_p=1,
                frequency_penalty=0,
                presence_penalty=0
            )
            final_response = response.choices[0].message.content

            # Check answer formatting
            try:
                final_response = eval(final_response)
                app.logger.info(f"******************** {str(final_response)}")
                # Check for keys in list's items
                if len(final_response) == 0:
                    return jsonify({"msg": False, "details": "formatting issue, no entries"})

                for i in final_response:
                    if not i.get("ingredient") and not i.get("amount_in_grams"):
                        return jsonify({"msg": False, "details": "formatting issue, keys"})

            except:
                return jsonify({"msg": False, "details": "formatting issue"})
            
            try:
                # Turn LLM detections to database food entries with name, and id
                starting_nutrient_vector = [float(0) for _ in range(17)]

                db_foods = []
                for llm_food in final_response:
                    app.logger.info(f"******************** LLM FOOD ITEM: {str(llm_food)}")
                    # Find closest food name wise in db
                    query_embed = sbert.encode(str(llm_food.get("ingredient")))
                    pipeline = [
                        {
                            '$vectorSearch': {
                                'index': 'food_name_search',
                                'path': 'food_embedding', 
                                'queryVector': query_embed.tolist(), 
                                'numCandidates': 200, 
                                'limit': 1
                            }
                        }
                    ]
                    db_food = [i for i in nutrient_col.aggregate(pipeline)]
                    app.logger.info(f"******************** DB FOOD ITEM 0: {str(db_food[0])}")
                    # Get the factor based on 1.0 being 100g
                    grams_factor = float(llm_food.get("amount_in_grams")) / 100.0
                    # calculate the nutrient amounts in the nutrient vector
                    this_foods_nutrient_vector = [i*grams_factor for i in db_food[0].get("nutrient_vector")] 
                    # Add this foods nutrient vector to the starting/changing vector
                    starting_nutrient_vector = [a + b for a, b in zip(this_foods_nutrient_vector, starting_nutrient_vector)]

                    db_foods.append({
                        "food_name": db_food[0].get("food"),
                        "food_id": db_food[0].get("_id"),
                        "amount_in_grams": float(llm_food.get("amount_in_grams")),
                        "food_origin": db_food[0].get("data_origin"),
                        "dish": "lunch"
                    })

                # Check for existing db entry
                res = user_logs_col.find_one({
                    "date": str(datetime.today())[:10],
                    "user_id": user.get("_id")
                })
                if res:
                    # Sum up the newly created nutrient vector and the pre-existing one
                    new_nutrient_vector = [a + b for a, b in zip(res.get("nutrient_vector"), starting_nutrient_vector)]

                    # Update database with newly tracked foods for the day
                    user_logs_col.update_one({
                        "date": str(datetime.today())[:10],
                        "user_id": user.get("_id")
                    }, {
                        "$push": {
                            "logged_foods": {
                                "$each": db_foods
                            }
                        },
                        "$set": {
                            "nutrient_vector": new_nutrient_vector
                        }
                    })
                else:
                    # Create first doc for that day
                    user_logs_col.insert_one({
                        "date": str(datetime.today())[:10],
                        "user_id": user.get("_id"),
                        "logged_foods": db_foods,
                        "nutrient_vector": starting_nutrient_vector
                    })

                for detected_food in db_foods:
                    detected_food.update({"food_id": str(detected_food.get("food_id"))})

                return jsonify({"msg": True, "detected_foods": db_foods, "details": recording.filename})
            except:
                return jsonify({"msg": False, "details": "database issue"})

    return jsonify({"msg": False, "details": "end"})

@app.route("/api/process-message", methods=["POST"])
def process_message():
    status, user = authenticate_cookies(request)
    if status:
        if len(request.get_json().get('userMessage')) > 0 and request.get_json().get('userMessage') != None and len(request.get_json().get('chatSession')) > 0 and request.get_json().get('chatSession') != None:
            res = chatbot_logs_col.find_one({
                "chat_session": request.get_json().get('chatSession'),
                "user_token": user.get("token")
            })
            
            # Run RAG process
            answer, faithfulness = run_query_and_evaluat_web_app(request.get_json().get('userMessage'), res)

            # Check for existing conversation doc in chatbot_logs_col
            res = chatbot_logs_col.find_one({
                "chat_session": request.get_json().get('chatSession'),
                "user_token": user.get("token")
            })
            
            # Save message to database 
            if res:
                chatbot_logs_col.update_one({
                    "chat_session": request.get_json().get('chatSession'),
                    "user_token": user.get("token")
                }, {
                    "$push": {
                        "conversation": {
                            "role": "user",
                            "text": request.get_json().get('userMessage'),
                        }
                    }
                })
                chatbot_logs_col.update_one({
                    "chat_session": request.get_json().get('chatSession'),
                    "user_token": user.get("token")
                }, {
                    "$push": {
                        "conversation": {
                            "role": "system",
                            "text": answer,
                            "faithfulness": faithfulness
                        }
                    }
                })
                messages = res.get("conversation")
                messages.extend([
                    {
                        "role": "user",
                        "text": request.get_json().get('userMessage')
                    },
                    {
                        "role": "system",
                        "text": answer,
                        "faithfulness": faithfulness 
                    }
                ])
                return jsonify({"msg": True, "messages": messages})
            
            else:
                chatbot_logs_col.insert_one({
                    "timestamp": datetime.now(),
                    "user_token": user.get("token"),
                    "conversation": [
                        {
                            "role": "user",
                            "text": request.get_json().get('userMessage')
                        },
                        {
                            "role": "system",
                            "text": answer,
                            "faithfulness": faithfulness 
                        }
                    ],
                    "chat_session": request.get_json().get('chatSession')
                })
                return jsonify({"msg": True, "messages": [
                    {
                        "role": "user",
                        "text": request.get_json().get('userMessage')
                    },
                    {
                        "role": "system",
                        "text": answer,
                        "faithfulness": faithfulness 
                    }
                ]})
        else:
            return jsonify({"msg": False, "details": "wrong input"})
        
    return jsonify({"msg": False, "details": "end"})

@app.route("/api/search-foods", methods=["POST"])
def search_foods():
    status, user = authenticate_cookies(request)
    if status:
        if request.get_json().get("query") and len(request.get_json().get("query")) > 0:
            # Search for food names based on query by user
            query_embed = sbert.encode(str(request.get_json().get("query")))
            pipeline = [
                {
                    '$vectorSearch': {
                        'index': 'food_name_search',
                        'path': 'food_embedding', 
                        'queryVector': query_embed.tolist(), 
                        'numCandidates': 200, 
                        'limit': 10
                    }
                }
            ]
            results = [{"food_name": i.get("food"), "data_origin": i.get("data_origin"), "data_url": i.get("scraped_url")} for i in nutrient_col.aggregate(pipeline)]

            return jsonify({"msg": True, "query_results": results})

    return jsonify({"msg": False, "details": "end"})

@app.route("/api/get-todays-foods", methods=["GET"])
def get_todays_foods():
    status, user = authenticate_cookies(request)
    if status:
        db_foods = user_logs_col.find_one({
            "date": str(datetime.today())[:10],
            "user_id": user.get("_id")
        })
        if not db_foods:
            return jsonify({"msg": True, "foods": []})
        
        for detected_food in db_foods.get("logged_foods"):
            detected_food.update({"food_id": str(detected_food.get("food_id"))})

        return jsonify({"msg": True, "foods": db_foods.get("logged_foods")})
    
    return jsonify({"msg": False, "details": "end"})

@app.route("/api/get-nutrient-coverage", methods=["GET"])
def get_nutrient_coverage():
    status, user = authenticate_cookies(request)
    if status:
        stats = {
            "remainingCalories": 1100
        }
        res = user_logs_col.find_one({
            "date": str(datetime.today())[:10],
            "user_id": user.get("_id")
        })
        if user.get("sex") == "female":
            recommended_vector = female_recommendation_vector
        else:
            recommended_vector = male_recommendation_vector

        if res and len(res.get("logged_foods")) > 0:
            micronutrients = []
            macronutrients = []
            totalProgress = []
            for idx, micronutrient in enumerate(list_nutrient_names):
                micronutrients.append({
                    "name": micronutrient,
                    "percentage": min([int((res.get("nutrient_vector")[idx] / recommended_vector[idx]) * 100), 100])
                })
                totalProgress.append(min([int((res.get("nutrient_vector")[idx] / recommended_vector[idx]) * 100), 100]))
            stats.update({"microNutrients": micronutrients})
            stats.update({
                "totalProgress": int(statistics.mean(totalProgress))
            })
            
            macros = {
                "Carbohydrates": 0.0,
                "Fats": 0.0,
                "Protein": 0.0
            }

            for logged_food in res.get("logged_foods", []):
                fat = 0.0
                carbs = 0.0
                protein = 0.0
                
                # Get the macro amount per 100g 
                db_entry = nutrient_col.find_one({
                    "_id": ObjectId(logged_food.get("food_id"))
                })
                
                for nutrient in db_entry.get("nutrients"):
                    if nutrient.get("nutrient") == "Total lipid (fat)":
                        fat = nutrient.get("amount", 0.0)
                    if nutrient.get("nutrient") == "Carbohydrate, by difference":
                        carbs = nutrient.get("amount", 0.0)
                    if nutrient.get("nutrient") == "Protein":
                        protein = nutrient.get("amount", 0.0)

                # Multiply the amount by gram factor
                gram_factor = float(logged_food.get("amount_in_grams")) / 100.0
                fat = fat * gram_factor
                carbs = carbs * gram_factor
                protein = protein * gram_factor

                # Update macros dict
                macros.update({
                    "Carbohydrates": macros.get("Carbohydrates") + carbs,
                    "Fats": macros.get("Fats") + fat,
                    "Protein": macros.get("Protein") + protein
                })

            energy_need = harris_benedict_formula(sex=user.get("sex"), weight=user.get("weight"), height=user.get("height"), age=user.get("age"), physical_activity=user.get("physical_activity"))
            protein_factor = 0.8
            fat_energy_percentage = 0.275
            carbs_energy_percentage = 0.525

            stats.update({
                "macroNutrients": [
                    {
                        "name": "Protein",
                        "percentage": min([int(macros.get("Protein") / float(user.get("weight") * protein_factor) * 100), 100])
                    },
                    {
                        "name": "Fats",
                        "percentage": min([int(float(macros.get("Fats") * 9.0) / float(energy_need * fat_energy_percentage) * 100), 100])
                    },
                    {
                        "name": "Carbohydrates",
                        "percentage": min([int(float(macros.get("Carbohydrates") * 4.0) / float(energy_need * carbs_energy_percentage) * 100), 100])
                    }
                ]
            })

            return jsonify({"msg": True, "nutrient_stats": stats})        
        else:
            # Has not eaten anything today, so all 0%
            micronutrients = []
            macronutrients = []
            for idx, micronutrient in enumerate(list_nutrient_names):
                micronutrients.append({
                    "name": micronutrient,
                    "percentage": 0
                })
            stats.update({"microNutrients": micronutrients})
            for macro in ["Carbohydrates", "Fats", "Protein"]:
                macronutrients.append({
                    "name": macro,
                    "percentage": 0
                })  
            stats.update({"macroNutrients": macronutrients})
            stats.update({
                "totalProgress": 0
            })

            return jsonify({"msg": True, "nutrient_stats": stats})        
    
    return jsonify({"msg": False})

@app.route("/api/detect-food-image", methods=["POST"])
def detect_foods_in_image():
    status, user = authenticate_cookies(request)
    if status:
        uploaded_img = request.files.get("image")
        if uploaded_img.filename == '':
            return jsonify({"msg": False, "details": "No file"})
        
        uploaded_img.save(os.path.join("data", uploaded_img.filename))
        
        if not llm_for_detection:
            try:
                results = yolo_model(os.path.join("data", uploaded_img.filename))
            except:
                return jsonify({"msg": False, "details": "yolo model"})

            recognized_foods = []
            for result in results.xyxy[0].tolist():
                if result[4] > 0.5:
                    recognized_foods.append(yolo_classes[int(result[5])])

            os.remove(os.path.join("data", uploaded_img.filename))

            return jsonify({"msg": True, "detected": recognized_foods, "llm":False})
        else:
            response = openai_client.chat.completions.create(
                model="gpt-4-turbo",
                messages=[
                    {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Please detect the food items in the attached image as well as an approximate amount visible measured in grams. Split dishes into the single ingredients. For example, if the user says 'hamburger', please split it into probable ingredients, like 'burger bun', 'beef patty', 'lettuce' and 'onions'. Please also guess any invisible ingredients, like e.g. olive oil or sugar. ONLY return a JSON list where each item is an object with the keys 'food_name' and 'amount_in_grams."},
                        {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{encode_image(os.path.join('data', uploaded_img.filename))}",
                            "detail": "low"
                        },
                        },
                    ],
                    }
                ],
                max_tokens=300,
                temperature=0
            )

            os.remove(os.path.join("data", uploaded_img.filename))

            text = response.choices[0].message.content
            text = text.replace("\n", "")

            # Regular expression to match everything between the first '[' and the last ']'
            pattern = r'\[.*\]'

            # Search for the pattern in the text
            match = re.search(pattern, text)

            # Extract and print the result if a match is found
            if match:
                result = match.group(0)
                json_results = json.loads(result)
            else:
                return jsonify({"msg": False, "details": "Data formatting issue"})

            # Add name embed (food_embedding) query and log detected foods
            try:
                # Turn LLM detections to database food entries with name, and id
                starting_nutrient_vector = [float(0) for _ in range(17)]

                db_foods = []
                for llm_food in json_results:
                    # Find closest food name wise in db
                    query_embed = sbert.encode(str(llm_food.get("food_name")))
                    pipeline = [
                        {
                            '$vectorSearch': {
                                'index': 'food_name_search',
                                'path': 'food_embedding', 
                                'queryVector': query_embed.tolist(), 
                                'numCandidates': 200, 
                                'limit': 1
                            }
                        }
                    ]
                    db_food = [i for i in nutrient_col.aggregate(pipeline)]

                    # Get the factor based on 1.0 being 100g
                    grams_factor = float(llm_food.get("amount_in_grams")) / 100.0
                    # calculate the nutrient amounts in the nutrient vector
                    this_foods_nutrient_vector = [i*grams_factor for i in db_food[0].get("nutrient_vector")] 
                    # Add this foods nutrient vector to the starting/changing vector
                    starting_nutrient_vector = [a + b for a, b in zip(this_foods_nutrient_vector, starting_nutrient_vector)]

                    db_foods.append({
                        "food_name": db_food[0].get("food"),
                        "food_id": db_food[0].get("_id"),
                        "amount_in_grams": float(llm_food.get("amount_in_grams")),
                        "food_origin": db_food[0].get("data_origin"),
                        "dish": "lunch"
                    })

                # Check for existing db entry
                res = user_logs_col.find_one({
                    "date": str(datetime.today())[:10],
                    "user_id": user.get("_id")
                })
                if res:
                    # Sum up the newly created nutrient vector and the pre-existing one
                    new_nutrient_vector = [a + b for a, b in zip(res.get("nutrient_vector"), starting_nutrient_vector)]

                    # Update database with newly tracked foods for the day
                    user_logs_col.update_one({
                        "date": str(datetime.today())[:10],
                        "user_id": user.get("_id")
                    }, {
                        "$push": {
                            "logged_foods": {
                                "$each": db_foods
                            }
                        },
                        "$set": {
                            "nutrient_vector": new_nutrient_vector
                        }
                    })
                else:
                    # Create first doc for that day
                    user_logs_col.insert_one({
                        "date": str(datetime.today())[:10],
                        "user_id": user.get("_id"),
                        "logged_foods": db_foods,
                        "nutrient_vector": starting_nutrient_vector
                    })

                return jsonify({"msg": True, "llm": True})
            except:
                return jsonify({"msg": False, "details": "database issue"})

    return jsonify({"msg": False})

@app.route("/api/get-article-recommendations", methods=["GET"])
def get_articles():
    status, user = authenticate_cookies(request)
    if status:
        res = chatbot_logs_col.find({"timestamp": {"$lt": datetime.now()}, "user_token": user.get("token")})

        if res:
            conversation_docs = [i.get("conversation") for i in res]
            
            all_queries = []
            for doc in conversation_docs:
                for conversation_item in doc:
                    if conversation_item.get("role") == "user":
                        all_queries.append(conversation_item.get("text"))

            summed_queries = " ".join(all_queries)

            pipeline = [
                {
                    '$vectorSearch': {
                        'index': 'article_search',
                        'path': 'embeddedings', 
                        'queryVector': get_openai_embedding(summed_queries), 
                        'numCandidates': 1536, 
                        'limit': 5
                    }
                }
            ]
            result = [i for i in articles_col.aggregate(pipeline)]
            for i in result:
                i.update({"_id": str(i.get("_id"))})

            return jsonify({"msg": True, "articles": result})
        
        else:
            return jsonify({"msg": False, "details": "User in DB not found"})

    return jsonify({"msg": False})

@app.route("/api/get-article", methods=["GET"])
def get_article():
    status, user = authenticate_cookies(request)
    if status:
        if request.args.get("t"):
            article = articles_col.find_one({
                "token": str(request.args.get("t"))
            })
            article.update({"_id": str(article.get("_id"))})

            if article:
                return jsonify({"msg": True, "article": article})

    return jsonify({"msg": False})

@app.route("/api/get-user-data", methods=["GET"])
def get_user_data():
    status, user = authenticate_cookies(request)
    if status:
        user.update({"_id": str(user.get("_id"))})
        user.update({"account_created": user.get("creation_date").strftime("%d.%m.%Y")})
        return jsonify({"msg": True, "user_data": user})
        
    return jsonify({"msg": False})

@app.route("/api/log-single-food", methods=["POST"])
def log_single_food():
    status, user = authenticate_cookies(request)
    if status:
        if request.get_json().get("foodName") and request.get_json().get("amount"):
            food_from_db = nutrient_col.find_one({
                "food": str(request.get_json().get("foodName"))
            })
            if food_from_db:
                # Create food element for log entry
                food_to_be_logged = {
                    "food_name": food_from_db.get("food"),
                    "food_id": food_from_db.get("_id"),
                    "amount_in_grams": float(request.get_json().get("amount")),
                    "food_origin": food_from_db.get("data_origin"),
                    "dish": "lunch"
                }

                # Initiate zero vector
                starting_nutrient_vector = [float(0) for _ in range(17)]

                # Get the factor based on 1.0 being 100g
                grams_factor = float(food_to_be_logged.get("amount_in_grams")) / 100.0

                # calculate the nutrient amounts in the nutrient vector
                this_foods_nutrient_vector = [i*grams_factor for i in food_from_db.get("nutrient_vector")] 

                # Add this foods nutrient vector to the starting/changing vector
                starting_nutrient_vector = [a + b for a, b in zip(this_foods_nutrient_vector, starting_nutrient_vector)]

                # Check for existing db entry
                res = user_logs_col.find_one({
                    "date": str(datetime.today())[:10],
                    "user_id": user.get("_id")
                })
                if res:
                    # Sum up the newly created nutrient vector and the pre-existing one
                    new_nutrient_vector = [a + b for a, b in zip(res.get("nutrient_vector"), starting_nutrient_vector)]

                    # Update database with newly tracked foods for the day
                    user_logs_col.update_one({
                        "date": str(datetime.today())[:10],
                        "user_id": user.get("_id")
                    }, {
                        "$push": {
                            "logged_foods": food_to_be_logged
                        },
                        "$set": {
                            "nutrient_vector": new_nutrient_vector
                        }
                    })
                else:
                    # Create first doc for that day
                    user_logs_col.insert_one({
                        "date": str(datetime.today())[:10],
                        "user_id": user.get("_id"),
                        "logged_foods": [food_to_be_logged],
                        "nutrient_vector": starting_nutrient_vector
                    })

                return jsonify({"msg": True})

    return jsonify({"msg": False})

@app.route("/api/remove-single-food", methods=["POST"])
def remove_single_food():
    status, user = authenticate_cookies(request)
    if status:
        if request.get_json().get("name") and request.get_json().get("amount"):
            food_from_db = nutrient_col.find_one({
                "food": str(request.get_json().get("name"))
            })
            if food_from_db:
                food_to_be_logged = {
                    "food_name": food_from_db.get("food"),
                    "food_id": food_from_db.get("_id"),
                    "amount_in_grams": float(request.get_json().get("amount")),
                    "food_origin": food_from_db.get("data_origin"),
                    "dish": "lunch"
                }

                log_entry = user_logs_col.find_one({
                    "date": str(datetime.today())[:10],
                    "user_id": user.get("_id"),
                    "logged_foods": {
                        "$elemMatch" : food_to_be_logged
                    }
                })
                if log_entry:
                    # Initiate zero vector
                    starting_nutrient_vector = [float(0) for _ in range(17)]

                    # Get the factor based on 1.0 being 100g
                    grams_factor = float(food_to_be_logged.get("amount_in_grams")) / 100.0

                    # calculate the nutrient amounts in the nutrient vector
                    this_foods_nutrient_vector = [i*grams_factor for i in food_from_db.get("nutrient_vector")] 

                    # Add this foods nutrient vector to the starting/changing vector
                    starting_nutrient_vector = [a + b for a, b in zip(this_foods_nutrient_vector, starting_nutrient_vector)]

                    # Sum up the newly created nutrient vector and the pre-existing one
                    new_nutrient_vector = [a - b for a, b in zip(log_entry.get("nutrient_vector"), starting_nutrient_vector)]

                    # Update database with newly tracked foods for the day
                    try:
                        user_logs_col.update_one({
                            "date": str(datetime.today())[:10],
                            "user_id": user.get("_id")
                        }, {
                            "$pull": {
                                "logged_foods": food_to_be_logged
                            },
                            "$set": {
                                "nutrient_vector": new_nutrient_vector
                            }
                        })
                        return jsonify({"msg": True})
                    
                    except:
                        return jsonify({"msg": False, "details": "database"})
                else:
                    return jsonify({"msg": False, "details": "Log not found"})

    return jsonify({"msg": False})

@app.route("/api/get-recipe-recommendations", methods=["GET"])
def get_recipes():
    status, user = authenticate_cookies(request)
    if status:
        if request.method == "GET":
            # Get todays, current nutrient vector of user from user_logs_col
            todays_entry = user_logs_col.find_one({
                "date": str(datetime.today())[:10],
                "user_id": user.get("_id")
            })

            if todays_entry and len(todays_entry.get("logged_foods")) > 0:
                if user.get("sex") == "female":
                    user_vector = [max([0.0, (a - b)]) for a, b in zip(female_recommendation_vector, todays_entry.get("nutrient_vector"))]
                else:
                    user_vector = [max([0.0, (a - b)]) for a, b in zip(male_recommendation_vector, todays_entry.get("nutrient_vector"))]
                
            else:
                # No foods consumed today 
                if user.get("sex") == "female":
                    user_vector = female_recommendation_vector
                else:
                    user_vector = male_recommendation_vector

            if len(user_vector) != 17:
                return jsonify({"msg": False, "vector": user_vector})
            
            # Standardization of user vector
            res = means_stds_col.find_one()
            std_user_vector = np.nan_to_num(((np.array(user_vector) - np.array(res.get("means"))) / np.array(res.get("stds"))), nan=0).tolist()

            # Make vector search
            # pipeline = [
            #     {
            #         '$vectorSearch': {
            #             'index': 'recipe_recommendation_search',
            #             'path': 'std_nutrient_vector', 
            #             'queryVector': std_user_vector,
            #             'numCandidates': 200, 
            #             'limit': 10
            #         }
            #     }
            # ]
            # results = [i for i in nutrient_col.aggregate(pipeline)]
            res = recipes_col.find()
            results = [{"name": i.get("name"), "items": i.get("ingredients"), "std_vector": i.get("std_nutrient_vector")} for i in res]
            cos_scores = util.cos_sim(std_user_vector, [i.get("std_vector") for i in results]).tolist()[0]

            # Zip the lists together
            zipped_lists = zip(cos_scores, results)

            # Sort the zipped list based on the first list's values in descending order
            sorted_zipped_lists = sorted(zipped_lists, key=lambda x: x[0], reverse=True)

            # Unzip the sorted zipped list
            _, sorted_list2 = zip(*sorted_zipped_lists)

            results = list(sorted_list2)

            for i in results:
                for n in i.get("items"):
                    n.update({"id": str(n.get("id"))})

            return jsonify({"msg": True, "recipes": results})
        
        else:
            return jsonify({"msg": False})

    return jsonify({"msg": False})

