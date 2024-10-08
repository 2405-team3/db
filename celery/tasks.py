'''
define background task for Celery worker
'''
import os

from dotenv import load_dotenv
from db.evals import evals
from celery import Celery

load_dotenv(override=True)

ENVIRONMENT = os.getenv('ENVIRONMENT', 'production')

if ENVIRONMENT == 'production':
    app = Celery(
        'tasks',
        broker='sqs://',
        task_default_queue="SQSQueuePaisley.fifo"
    )
    print('celery.py:  using AWS SQS as message broker')
else:
    app = Celery('tasks', broker='redis://localhost')
    print('celery.py:  using local redis as message broker')


@app.task
def run_evals_background(chatbot_id, query, context, output):
    print('celery.py run_evals_background: info received', chatbot_id, query, context, output)
    evals.evaluate_and_store_running_entry(
        chatbot_id,
        query,
        context,
        output
    )
    print('celery.py run_evals_background:  task complete?')
    return f'run_evals_background: chatbot_id: {chatbot_id}, query: {query}'

# if __name__ == '__main__':
#     app.start()
