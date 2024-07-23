import os
import pymongo
import boto3
import json

from dotenv import load_dotenv

from llama_parse import LlamaParse
from llama_index.core.node_parser import MarkdownElementNodeParser
from llama_index.llms.openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.vector_stores.awsdocdb import AWSDocDbVectorStore
from llama_index.core import VectorStoreIndex
from llama_index.core import StorageContext



load_dotenv(override=True)
mongo_uri = os.environ["MONGO_URI"]
mongodb_client = pymongo.MongoClient(mongo_uri)
llama_parse_api_key = os.environ["LLAMA_PARSE_KEY"]
openai_api_key = os.environ["OPENAI_API_KEY"]

# load file from s3 return file content
def get_file_from_s3(event):
    # gather the bucket name and file key from the s3 event
    file_load_event = event['Records'][0]['s3']
    bucket_name = file_load_event['bucket']['name']
    file_key = file_load_event['object']['key']

    # load the file from s3
    s3_client = boto3.client('s3')
    response = s3_client.get_object(Bucket=bucket_name, Key=file_key)
    file_content = response['Body'].read()

    return {'file_content':file_content, 'file_key':file_key}


# load file content to lambda os
# return lambda os file path
def load_file_to_lambda_os(file_content_and_key):
    file_content = file_content_and_key['file_content']
    file_key = file_content_and_key['file_key']
    with open(f'/tmp/{file_key}', 'wb') as f:
        f.write(file_content)

    return '/tmp/{file_key}'


# send file to llama parse
# return markdown documents
def send_file_to_llama_parse(file_path):
    parser = LlamaParse(
        api_key=llama_parse_api_key,
        result_type="markdown"
    )

    markdown_documents = parser.load_data(file_path)

    return markdown_documents

# convert markdown documents
# return nodes
def markdown_to_node(documents):
    
    markdown_parser = MarkdownElementNodeParser(
        llm=OpenAI(api_key=openai_api_key, model="gpt-3.5-turbo"),
        num_workers=8,
    )

    nodes = markdown_parser.get_nodes_from_documents(documents)
    
    return nodes


# convert nodes to vector store
# side effect: save index to docdb
def nodes_to_vector_store(nodes):
    embed_model = OpenAIEmbedding(api_key=openai_api_key, model="gpt-3.5-turbo")
    store = AWSDocDbVectorStore(mongodb_client, db_name='lambdadb', collection_name='lambdacollection')
    storage_context = StorageContext.from_defaults(vector_store=store)

    index = VectorStoreIndex.from_nodes(nodes, embed_model=embed_model)

    index.save_to_storage(storage_context)

    return index


def lambda_handler(event, context):
    try:
        file_path_and_key = get_file_from_s3(event)
        file_path = load_file_to_lambda_os(file_path_and_key)
        markdown_documents = send_file_to_llama_parse(file_path)
        nodes = markdown_to_node(markdown_documents)
        nodes_to_vector_store(nodes)

    except Exception as e:
        print(f'an error occured {e}')
        return {
            'statusCode': 500,
            'body': json.dumps('Error!')
        }

    return {
        'statusCode': 200,
        'body': json.dumps('Process successfully executed')
    }

