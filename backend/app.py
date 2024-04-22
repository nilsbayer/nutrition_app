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
from sentence_transformers import util

app = Flask(__name__, static_url_path="/")
CORS(app, origins=['http://localhost:3000'])
bcrypt = Bcrypt(app)

app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY_APP")
enc_key = os.environ.get("ENC_KEY")

# Load database
myclient = pymongo.MongoClient(os.environ.get("DB_URI"))
db = myclient["foods"]
mongo_col = db["nutrient_data"]

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

for food in mongo_col.find():
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
        
        user = mongo_col.find_one({ "email": user_email })
        # app.logger.info(user)
        if user != None and user.get("tours") != None:
            return [True, user]
        else:
            return [False, "_"]
        
    else:
        return [False, "_"]


"***************************** Routes *****************************"

@app.route("/api/login", methods=["POST"])
def login():
    if request.method == "POST":
        if request.get_json().get("email") and request.get_json().get("password"):
            user_email = request.get_json().get("email")
            user_pwd = request.get_json().get("password")

            user = mongo_col.find_one({ "email": user_email })
            if user != None:

                is_valid = bcrypt.check_password_hash(user.get("password"), user_pwd)

                if is_valid:
                    encoded = jwt.encode({"email": user_email}, enc_key, algorithm="HS256")

                    return jsonify({
                        "msg": "success",
                        "token": encoded,
                        "email": str(user_email),
                        "lang": str(user.get("language"))
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
#             if mongo_col.find_one({ "email": user_email }) != None:
#                 return jsonify({ "msg": "Ya hay una cuenta con este correo electronico." })

#             # Create new user instance
#             encoded_pwd = bcrypt.generate_password_hash(user_pwd).decode('utf-8')

#             # Check whether UUID is already given
#             while True:
#                 this_uuid = str(uuid.uuid1())
#                 if mongo_col.find_one({ "id": this_uuid }) == None:
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
#             mongo_col.insert_one(new_user)

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