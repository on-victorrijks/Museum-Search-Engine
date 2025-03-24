# API README
## Development
```bash
python api.py
```
## Production
```bash
gunicorn -w 4 -b 0.0.0.0:5000 api:app
```

## Testings
The database **test_db** must be a a copy of the original database !
```bash
pg_dump -U postgres -d database -Fc > /tmp/database.dump
pg_restore -U postgres -d test_db --clean --if-exists /tmp/database.dump
rm /tmp/database.dump

pytest
# Test coverage
pytest --cov=.
# Execute all the tests from a file
pytest tests/test_database.py
# Execute a specific test
pytest tests/test_database.py::TestDatabaseManager::test_apply_hard_constraints_empty
```