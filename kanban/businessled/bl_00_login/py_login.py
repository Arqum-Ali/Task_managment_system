from flask import Blueprint, render_template, redirect, request, url_for
from flask_login import current_user, login_user, logout_user, UserMixin, login_required
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField
from wtforms.validators import Email, DataRequired
from businessled import db, login_manager
import os
import hashlib
import binascii


class LoginForm(FlaskForm):
    username = StringField("Username", id="username_login", validators=[DataRequired()])
    password = PasswordField("Password", id="pwd_login", validators=[DataRequired()])


class CreateAccountForm(FlaskForm):
    username = StringField("Username", id="username_create", validators=[DataRequired()])
    email = StringField("Email", id="email_create", validators=[DataRequired(), Email()])
    password = PasswordField("Password", id="pwd_create", validators=[DataRequired()])


def hash_pass(password):
    """Hash a password for storing."""

    salt = hashlib.sha256(os.urandom(60)).hexdigest().encode("ascii")
    pwdhash = hashlib.pbkdf2_hmac("sha512", password.encode("utf-8"), salt, 100000)
    pwdhash = binascii.hexlify(pwdhash)
    return salt + pwdhash  # return bytes


def verify_pass(provided_password, stored_password):
    """Verify a stored password against one provided by user"""

    stored_password = stored_password.decode("ascii")
    salt = stored_password[:64]
    stored_password = stored_password[64:]
    pwdhash = hashlib.pbkdf2_hmac(
        "sha512", provided_password.encode("utf-8"), salt.encode("ascii"), 100000
    )
    pwdhash = binascii.hexlify(pwdhash).decode("ascii")
    return pwdhash == stored_password


class Users(db.Model, UserMixin):
    __tablename__ = "Users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True)
    email = db.Column(db.String(64), unique=True)
    password = db.Column(db.LargeBinary)

    def __init__(self, **kwargs):
        for property, value in kwargs.items():
            # depending on whether value is an iterable or not, we must
            # unpack it's value (when **kwargs is request.form, some values
            # will be a 1-element list)
            if hasattr(value, "__iter__") and not isinstance(value, str):
                # the ,= unpack of a singleton fails PEP8 (travis flake8 test)
                value = value[0]
            if property == "password":
                value = hash_pass(value)  # we need bytes here (not plain str)
            setattr(self, property, value)

    def __repr__(self):
        return str(self.username)


@login_manager.user_loader
def user_loader(id):
    return Users.query.filter_by(id=id).first()


@login_manager.request_loader
def request_loader(request):
    username = request.form.get("username")
    user = Users.query.filter_by(username=username).first()
    return user if user else None


# , template_folder='templates' )
login = Blueprint("login_blueprint", __name__)


@login.route("/")
def route_default():
    return redirect(url_for("login_blueprint.login_func"))


@login.route("/index")
@login_required
def index():
    segment = get_segment(request)
    return render_template("index.html", segment="index")


@login.route("/login", methods=["GET", "POST"])
def login_func():
    login_form = LoginForm(request.form)
    if "login" in request.form:
        # read form data
        username = request.form["username"]
        password = request.form["password"]
        print(username)
        print(password)
        print(Users.query.all())
        print(db)

        # Locate user
        user = Users.query.filter_by(username=username).first()

        # Check the password
        if user and verify_pass(password, user.password):
            login_user(user)

            return redirect(url_for("login_blueprint.route_default"))

        # Something (user or pass) is not ok
        return render_template(
            "login.html", msg="Wrong user or password", form=login_form
        )

    if not current_user.is_authenticated:
        return render_template("login.html", form=login_form)
    return redirect(url_for("login_blueprint.index"))


@login.route("/register", methods=["GET", "POST"])
def register_func():
    create_account_form = CreateAccountForm(request.form)
    if "register" in request.form:
        username = request.form["username"]
        email = request.form["email"]

        # Check usename exists
        user = Users.query.filter_by(username=username).first()
        if user:
            return render_template(
                "register.html",
                msg="Username already registered",
                success=False,
                form=create_account_form,
            )

        # Check email exists
        user = Users.query.filter_by(email=email).first()
        if user:
            return render_template(
                "register.html",
                msg="Email already registered",
                success=False,
                form=create_account_form,
            )

        # else we can create the user
        user = Users(**request.form)
        db.session.add(user)
        db.session.commit()

        return render_template(
            "register.html",
            msg='User created please <a href="/login">login</a>',
            success=True,
            form=create_account_form,
        )

    else:
        return render_template("register.html", form=create_account_form)


@login.route("/logout")
def logout_func():
    logout_user()
    return redirect(url_for("login_blueprint.logout_func"))


# Errors


@login_manager.unauthorized_handler
def unauthorized_handler():
    return render_template("page-403.html"), 403


@login.errorhandler(403)
def access_forbidden(error):
    return render_template("page-403.html"), 403


@login.errorhandler(404)
def not_found_error(error):
    return render_template("page-404.html"), 404


@login.errorhandler(500)
def internal_error(error):
    return render_template("page-500.html"), 500


# Helper - Extract current page name from request
def get_segment(request):
    try:
        segment = request.path.split("/")[-1]
        if segment == "":
            segment = "index"
        return segment
    except:
        return None
