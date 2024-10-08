'''
Paisley app - back-end server endpoints
'''
import os
import json
from datetime import timedelta

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm

# import nest_asyncio

import db.app_logger as log
import db.chatbot.query as cq
from db.evals import evals
from db.evals import eval_utils
from db.util import jwt

from db.celery.tasks import run_evals_background
from db.routers import chatbots
from db.routers import knowledge_bases
from db.db.session import get_db

ACCESS_TOKEN_EXPIRE_MINUTES = 30


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

app.include_router(
    chatbots.router,
    dependencies=[Depends(jwt.get_current_user)]
)

app.include_router(
    knowledge_bases.router,
    dependencies=[Depends(jwt.get_current_user)]
)

@app.get('/api')
async def root():
    log.info("server running")
    return {"message": "Server running"}

# for JWT token auth
@app.post("/api/token", response_model=jwt.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = jwt.authenticate_user(jwt.user_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = jwt.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# query route
@app.post('/api/query', dependencies=[Depends(jwt.get_current_user)])
async def post_query(body: cq.QueryBody, db=Depends(get_db)):
    response = cq.post_query(body, db)
    if response:
        context, output = eval_utils.extract_from_response(response)
        log.info(f"Adding background task for chatbot_id: {body.chatbot_id}",
                 f", query: {body.query}, output: {output}")
        run_evals_background.delay(
            body.chatbot_id,
            body.query,
            context,
            output
        )
    return response


# evals routes
@app.get('/api/history', dependencies=[Depends(jwt.get_current_user)])
async def get_evals():
    data = evals.get_chat_history()
    return data

@app.get('/api/scores', dependencies=[Depends(jwt.get_current_user)])
async def get_scores():
    config_path = os.path.join(os.path.dirname(__file__), 'evals', 'eval_config.json')
    with open(config_path, 'r', encoding="utf-8") as file:
        config = json.load(file)
    scores = config.get('scores', [])
    return scores


# if __name__ == "__main__":
#     import uvicorn
#     nest_asyncio.apply()
#     uvicorn.run(app, host="0.0.0.0", port=8000, loop='asyncio')
