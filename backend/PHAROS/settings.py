import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-pharos-2026-change-en-production')
DEBUG = os.environ.get('DEBUG', 'True') == 'True'

_ALLOWED = os.environ.get('ALLOWED_HOSTS', '')
# Le défaut incluait '*', qui accepte n'importe quel en-tête Host (risque
# d'attaque par Host header injection). En production, ALLOWED_HOSTS doit
# être défini explicitement via la variable d'environnement ; le défaut ne
# couvre plus que le développement local.
ALLOWED_HOSTS = _ALLOWED.split(',') if _ALLOWED else ['localhost', '127.0.0.1']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'cloudinary_storage',
    'cloudinary',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'accounts',
    'hotels',
    'reservations',
    'avis',
    'commissions',
    'evenements',
    'assistance',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'PHAROS.middleware.NoCacheAPIMiddleware',
]

ROOT_URLCONF = 'PHAROS.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'PHAROS.wsgi.application'

# --- Base de données ---
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.config(default=DATABASE_URL, conn_max_age=600)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': 'pharos_db',
            'USER': 'postgres',
            'PASSWORD': 'admin123',
            'HOST': 'localhost',
            'PORT': '5432',
            'OPTIONS': {'client_encoding': 'UTF8'},
        }
    }

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.AnonRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'anon': '60/min',
        'login': '5/min',
    },
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# --- CORS ---
_CORS = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if _CORS:
    CORS_ALLOWED_ORIGINS = _CORS.split(',')
else:
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    'accept',
    'authorization',
    'content-type',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'cache-control',
    'pragma',
]

AUTH_USER_MODEL = 'accounts.CustomUser'

AT_USERNAME = os.environ.get('AT_USERNAME', 'sandbox')
AT_API_KEY = os.environ.get('AT_API_KEY', '')

FEDAPAY_PUBLIC_KEY = os.environ.get('FEDAPAY_PUBLIC_KEY', '')
FEDAPAY_SECRET_KEY = os.environ.get('FEDAPAY_SECRET_KEY', '')
FEDAPAY_ENVIRONMENT = os.environ.get('FEDAPAY_ENVIRONMENT', 'sandbox')
FEDAPAY_BASE_URL = os.environ.get('FEDAPAY_BASE_URL', 'https://sandbox-api.fedapay.com')

FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Render (plan gratuit) n'a pas de disque persistant : tout fichier uploadé
# (photos, documents) disparaît au redémarrage. En production, les fichiers
# médias sont donc stockés sur Cloudinary plutôt que sur le disque local.
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.environ.get('CLOUDINARY_CLOUD_NAME', ''),
    'API_KEY': os.environ.get('CLOUDINARY_API_KEY', ''),
    'API_SECRET': os.environ.get('CLOUDINARY_API_SECRET', ''),
}

LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Africa/Porto-Novo'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Django 5.1+ ignore DEFAULT_FILE_STORAGE / STATICFILES_STORAGE (dépréciés puis
# supprimés) : il faut passer par STORAGES.
STORAGES = {
    'default': {
        'BACKEND': (
            'cloudinary_storage.storage.MediaCloudinaryStorage'
            if CLOUDINARY_STORAGE['CLOUD_NAME']
            else 'django.core.files.storage.FileSystemStorage'
        ),
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
