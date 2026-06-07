from django.shortcuts import render
from blog.models import BlogPost


def home(request):
    blogs = BlogPost.objects.all()[:8]   # show up to 8 posts in the ticker
    return render(request, 'home/home.html', {'blogs': blogs})
