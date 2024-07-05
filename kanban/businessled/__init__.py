import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager

db = SQLAlchemy()
login_manager = LoginManager()

def create_app():
    app = Flask(__name__)
    basedir = os.path.abspath(os.path.dirname(__file__))
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(
        basedir, "businessled.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = "Igp2vPIafA"

    db.init_app(app)
    login_manager.init_app(app)

    from .bl_00_login.py_login import login  # Adjust as per your actual structure
    from .bl_99_settings.py_kanban import kanban
    from .bl_99_settings.py_settings import settings

    app.register_blueprint(login)
    app.register_blueprint(settings)
    app.register_blueprint(kanban)

    return app
