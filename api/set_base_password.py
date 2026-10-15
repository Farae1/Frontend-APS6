"""Sets the base minister's password (asked in the terminal, never stored in
clear: the database keeps a scrypt hash).

  docker compose exec api python set_base_password.py
"""

import getpass
import sys

from auth import save_password_hash

password = getpass.getpass("Nova senha do ministro base: ")
if len(password) < 4:
    sys.exit("A senha precisa de pelo menos 4 caracteres.")
if getpass.getpass("Repita a senha: ") != password:
    sys.exit("As senhas não conferem.")
save_password_hash(password)
print("Senha do ministro base definida.")
