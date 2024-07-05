
import sys
import os
from flask import Flask
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy
import sqlite3
from calendar import monthrange
from flask import Blueprint, render_template, redirect, request, url_for, session, make_response
from flask_login import current_user, login_user, logout_user, UserMixin, login_required
from flask_wtf import FlaskForm
from wtforms import PasswordField
from wtforms.validators import Email, DataRequired
from wtforms.validators import DataRequired
from wtforms import (
    validators,
    SubmitField,
    StringField,
    SelectField,
    SelectMultipleField,
)
from jinja2 import TemplateNotFound
import pandas as pd
import numpy as np
import json
import datetime as dtm
from datetime import datetime

from businessled import db, login_manager
from businessled.static.func.myfunc import (
    human_format,
    date_string,
    string_date,
    getNumericColumns,
    genNestedDataList,
    genNestedColumns,
    growth100,
    round_num,
)


settings = Blueprint("settings_blueprint", __name__)

@settings.route("/settings", methods=["GET", "POST"])
@login_required
def settings_func():
  return render_template(
    "settings.html",
    segment="settings",)

