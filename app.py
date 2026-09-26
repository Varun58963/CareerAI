"""
app.py — Flask application entry point
Run:  python app.py
"""
import os
from flask import Flask, render_template, redirect, url_for, session

from database.models import init_db
from modules.auth import auth_bp
from modules.recommender import rec_bp
from modules.skill_gap import skill_gap_bp

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-change-in-prod-xyz789")
app.config["SESSION_COOKIE_HTTPONLY"] = True

# Register blueprints
app.register_blueprint(auth_bp,      url_prefix="/auth")
app.register_blueprint(rec_bp,       url_prefix="/api")
app.register_blueprint(skill_gap_bp, url_prefix="/api")

# ── Page routes ───────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/register")
def register_page():
    if "user_id" in session:
        return redirect(url_for("dashboard"))
    return render_template("register.html")

@app.route("/login")
def login_page():
    if "user_id" in session:
        return redirect(url_for("dashboard"))
    return render_template("login.html")

@app.route("/dashboard")
def dashboard():
    if "user_id" not in session:
        return redirect(url_for("login_page"))
    return render_template("dashboard.html")

@app.route("/profile")
def profile_page():
    if "user_id" not in session:
        return redirect(url_for("login_page"))
    return render_template("profile.html")

@app.route("/career/<int:career_id>")
def career_detail(career_id):
    if "user_id" not in session:
        return redirect(url_for("login_page"))
    return render_template("career_detail.html", career_id=career_id)

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))

# ── Report download route ─────────────────────────────────────────────────────

@app.route("/api/report/download")
def download_report():
    if "user_id" not in session:
        from flask import jsonify
        return jsonify({"error": "Authentication required"}), 401
    from modules.report import generate_report
    from flask import send_file
    import io
    uid  = session["user_id"]
    buf  = generate_report(uid)
    return send_file(
        io.BytesIO(buf),
        mimetype="application/pdf",
        as_attachment=True,
        download_name="career_recommendation_report.pdf"
    )

# ── Bootstrap ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    init_db()
    # Seed if empty
    from database.models import get_db
    conn = get_db()
    count = conn.execute("SELECT COUNT(*) FROM career").fetchone()[0]
    conn.close()
    if count == 0:
        print("[APP] Database empty — running seed …")
        from database.seed import seed
        seed()
    # Pre-train models
    from modules.recommender import _load_models
    _load_models()
    print("[APP] Starting Flask server → http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
