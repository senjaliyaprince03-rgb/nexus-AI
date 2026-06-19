# MongoDB Atlas Vector Search Setup

NexusAI uses MongoDB Atlas Vector Search for the Retrieval-Augmented Generation (RAG) pipeline.
To enable semantic search on your documents, you must create a Vector Search Index in your MongoDB Atlas cluster.

## 1. Create the Index

1. Go to your [MongoDB Atlas Dashboard](https://cloud.mongodb.com).
2. Navigate to **Database** > **Browse Collections**.
3. Select your database (e.g., `nexusai`) and the `document_chunks` collection.
4. Click on the **Atlas Search** tab and click **Create Search Index**.
5. Choose **JSON Editor**.

## 2. Index Configuration

Paste the following JSON definition into the editor:

```json
{
  "name": "vector_index",
  "type": "vectorSearch",
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 384,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "workspace_id"
    },
    {
      "type": "filter",
      "path": "document_id"
    }
  ]
}
```

*Note: `numDimensions` is set to 384, which matches the default `all-MiniLM-L6-v2` embedding model used by NexusAI.*

## 3. Configure the Backend

Once the index is created (it may take a few minutes to build), add the index name to your `.env` file:

```env
ATLAS_VECTOR_SEARCH_INDEX="vector_index"
```

Restart the FastAPI backend, and vector retrieval will now function correctly.
