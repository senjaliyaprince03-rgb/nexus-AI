import asyncio
from mongomock_motor import AsyncMongoMockClient
from pymongo import ASCENDING, IndexModel
async def test():
    db=AsyncMongoMockClient()['test']
    print('creating indexes')
    res=await db.users.create_indexes([IndexModel([('email', ASCENDING)], unique=True)])
    print(res)
asyncio.run(test())
