#config.py
import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your_secret_key_here'

class DevelopmentConfig(Config):
    DEBUG = True
    # 设置数据库URI
    SQLALCHEMY_DATABASE_URI = 'sqlite:///your_database.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class ProductionConfig(Config):
    DEBUG = False
    # 生产环境的数据库URI
    SQLALCHEMY_DATABASE_URI = 'mysql://user:password@server/db'

# 你可以继续添加更多的配置类
