"""Enrolls the face of an existing employee without going through an
approval (an administration tool: the base minister approves through the
password, see api/set_base_password.py). Two ways:

From a registration made in the app (the face captured by the camera): the
registration is merged into the employee, who takes its name and face.

  docker compose exec api python enroll.py MMA-000001 --from MMA-000100

From two photos in ./photos:

  docker compose run --rm -v "$PWD/photos:/photos" api \
      python enroll.py MMA-000001 --photos /photos/1.jpg /photos/2.jpg --name "Nome Completo"
"""

import argparse
import sys
from pathlib import Path

from common import embeddings, employees
from common.registration import check_faces

parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
parser.add_argument("employee_id")
source = parser.add_mutually_exclusive_group(required=True)
source.add_argument("--from", dest="registration", help="a registration under review to merge in")
source.add_argument("--photos", nargs=2, type=Path, metavar=("PHOTO1", "PHOTO2"))
parser.add_argument("--name", help="the employee's name (default: the registration's)")
args = parser.parse_args()

employee = employees.get(args.employee_id)
if employee is None:
    sys.exit(f"{args.employee_id} does not exist")

if args.registration:
    registration = employees.get(args.registration)
    if registration is None or registration.status != "UNDER_REVIEW":
        sys.exit(f"{args.registration} is not a registration under review")
    embeddings.move(registration.id, employee.id)
    employees.delete(registration.id)
    name = args.name or registration.name
else:
    vectors, problem = check_faces(args.photos[0].read_bytes(), args.photos[1].read_bytes(), exclude=employee.id)
    if problem:
        sys.exit(f"cannot enroll: {problem}")
    embeddings.replace(employee.id, vectors)
    name = args.name

if name:
    employees.rename(employee.id, name)
print(f"{employee.id} enrolled: {name or employee.name} ({employee.level}, {employee.status})")
