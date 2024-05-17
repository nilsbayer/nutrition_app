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
    context_relevancy,
    context_recall,
    answer_similarity,
    answer_correctness,
)
import pandas as pd

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
user_col = db["users"]
chatbot_logs_col = db["chatbot_logs_normal"]

sbert = SentenceTransformer("all-MiniLM-L6-v2")

logging.basicConfig(level=logging.DEBUG)

"********************** Create vectors **********************"
# All numbers saved as micrograms

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


food_names = []
nutrient_vectors = []

unit_table = {
    "µg": 1.0,
    "mg": 1000.0,
    "g": 1000000.0
}

for food in nutrient_col.find():
    this_food_dict = {}
    for i in food.get("nutrients"):
        if i.get("nutrient") == "Vitamin B-12":
            this_food_dict.update({"vitamin b-12": i.get("amount") * unit_table.get(i.get("unit"))})
        if i.get("nutrient") == "Vitamin A, RAE":
            this_food_dict.update({"vitamin a": i.get("amount") * unit_table.get(i.get("unit"))})
        if i.get("nutrient") == "Vitamin B-6":
            this_food_dict.update({"vitamin b-6": i.get("amount") * unit_table.get(i.get("unit"))})
        if i.get("nutrient") == "Niacin":
            this_food_dict.update({"niacin": i.get("amount") * unit_table.get(i.get("unit"))})
        if i.get("nutrient") == "Riboflavin":
            this_food_dict.update({"riboflavin (vitamin b-2)": i.get("amount") * unit_table.get(i.get("unit"))})
        if i.get("nutrient") == "Thiamin":
            this_food_dict.update({"thiamin (vitamin b-1)": i.get("amount") * unit_table.get(i.get("unit"))})
        if i.get("nutrient") == "Vitamin C, total ascorbic acid":
            this_food_dict.update({"vitamin c (ascorbic acid)": i.get("amount") * unit_table.get(i.get("unit"))})
        if i.get("nutrient") == "Sodium, Na":
            this_food_dict.update({"sodium": i.get("amount") * unit_table.get(i.get("unit"))})
        if i.get("nutrient") == "Potassium, K":
            this_food_dict.update({"potassium": i.get("amount") * unit_table.get(i.get("unit"))})
        if i.get("nutrient") == "Phosphorus, P":
            this_food_dict.update({"phosphorus": i.get("amount") * unit_table.get(i.get("unit"))})
        if i.get("nutrient") == "Magnesium, Mg":
            this_food_dict.update({"magnesium": i.get("amount") * unit_table.get(i.get("unit"))})
        if i.get("nutrient") == "Iron, Fe":
            this_food_dict.update({"iron": i.get("amount") * unit_table.get(i.get("unit"))})
        if i.get("nutrient") == "Calcium, Ca":
            this_food_dict.update({"calcium": i.get("amount") * unit_table.get(i.get("unit"))})
        if i.get("nutrient") == "Fiber, total dietary":
            this_food_dict.update({"total_fiber": i.get("amount") * unit_table.get(i.get("unit"))})
        if i.get("nutrient") == "Fiber, total dietary":
            this_food_dict.update({"total_fiber": i.get("amount") * unit_table.get(i.get("unit"))})
        if i.get("nutrient") == "Vitamin E (alpha-tocopherol)":
            this_food_dict.update({"vitamin e": i.get("amount") * unit_table.get(i.get("unit"))})
        if i.get("nutrient") == "Vitamin K (phylloquinone)":
            this_food_dict.update({"vitamin k": i.get("amount") * unit_table.get(i.get("unit"))})
        if i.get("nutrient") == "Cholesterol":
            this_food_dict.update({"cholesterol": i.get("amount") * unit_table.get(i.get("unit"))})

    food_vector = [
        this_food_dict.get("vitamin b-12"),
        this_food_dict.get("vitamin a"),
        this_food_dict.get("vitamin b-6"),
        this_food_dict.get("niacin"),
        this_food_dict.get("riboflavin (vitamin b-2)"),
        this_food_dict.get("thiamin (vitamin b-1)"),
        this_food_dict.get("vitamin c (ascorbic acid)", 0.0),
        this_food_dict.get("sodium"),
        this_food_dict.get("potassium"),
        this_food_dict.get("phosphorus"),
        this_food_dict.get("magnesium"),
        this_food_dict.get("iron"),
        this_food_dict.get("calcium"),
        this_food_dict.get("total_fiber"),
        this_food_dict.get("vitamin e"),
        this_food_dict.get("vitamin k"),
        this_food_dict.get("cholesterol")
    ]

    food_names.append(food.get("food"))
    nutrient_vectors.append(food_vector)

vector_length_sum = 0
for i in nutrient_vectors:
    vector_length_sum += len(i)

app.logger.info(f"RECOMMENDATION LENGTH {str(len(female_recommendation_vector))}")
app.logger.info(f"AVG FOOD VECTOR LENGTH {str(vector_length_sum / len(nutrient_vectors))}")
app.logger.info(util.cos_sim(female_recommendation_vector, nutrient_vectors))


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
        app.logger.info(user)
        if user != None:
            return [True, user]
        else:
            return [False, "_"]
        
    else:
        return [False, "_"]


def run_query_and_evaluat_web_app(query):
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

@app.route("/api/get-food-recommendations", methods=["POST"])
def get_food_recommendations():
    status, user = authenticate_cookies(request)
    if status:
        if request.method == "POST":
            user_vector = request.get_json().get("user_vector")
            user_vector = [float(value) for key, value in user_vector.items()]

            scores = util.cos_sim(user_vector, nutrient_vectors).tolist()[0]
            sorted_indexes = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
            top_five_indexes = sorted_indexes[:5]

            recommendations_to_send = []
            for i in top_five_indexes:
                recommendations_to_send.append({
                    "name": food_names[i],
                    "richIn": [
                        "+ Vitamin A", "+ Vitamin C", "+ Potassium"
                    ]
                })
                
            return jsonify({"msg": True, "recommendations": recommendations_to_send})

    return jsonify({"msg": False})

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
                return jsonify({"msg": True, "detected_foods": final_response, "details": recording.filename})
            except:
                return jsonify({"msg": False, "details": "formatting issue"})

    return jsonify({"msg": False, "details": "end"})

@app.route("/api/process-message", methods=["POST"])
def process_message():
    status, user = authenticate_cookies(request)
    if status:
        if len(request.get_json().get('userMessage')) > 0 and request.get_json().get('userMessage') != None and len(request.get_json().get('chatSession')) > 0 and request.get_json().get('chatSession') != None:
            # Run RAG process
            answer, faithfulness = run_query_and_evaluat_web_app(request.get_json().get('userMessage'))

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
                            "role": "agent",
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
                        "role": "agent",
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
                            "role": "agent",
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
                        "role": "agent",
                        "text": answer,
                        "faithfulness": faithfulness 
                    }
                ]})
        else:
            return jsonify({"msg": False, "details": "wrong input"})
        
    return jsonify({"msg": False, "details": "end", "status": status, "user": user})
