import asyncio
from mongomock_motor import AsyncMongoMockClient
async def test():
    db=AsyncMongoMockClient()['test']
    print('pinging')
    res=await db.command('ping')
    print(res)
asyncio.run(test())
