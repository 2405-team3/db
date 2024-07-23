from llama_index.vector_stores.aws_docdb import AWSDocDbVectorStore
import boto3
from pymongo import MongoClient

def connect_to_aws_docdb():
    # Connection string for AWS DocumentDB
    connection_string = "mongodb://cap2405team3:<insertYourPassword>@paisley-v0.cluster-clyqe0ey8t7e.us-east-1.docdb.amazonaws.com:27017/?tls=true&tlsCAFile=global-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"
    
    # Create a MongoDB client using the connection string
    client = MongoClient(connection_string)
    
    # Connect to the specific database
    db = client['your-database-name']
    
    # Create an instance of AWSDocDbVectorStore
    vector_store = AWSDocDbVectorStore(db)
    
    return vector_store

store = connect_to_aws_docdb()
print(store)
