import secrets
print("Your SECRET_KEY:")
print(secrets.token_hex(32))
print()
print("Copy the line above and paste it as SECRET_KEY in your .env files")
