from django.shortcuts import render, get_object_or_404
from .models import BlogPost


def blog(request):
    posts = BlogPost.objects.all()
    return render(request, 'blog/blog.html', {'posts': posts})


def post_detail(request, slug):
    post = get_object_or_404(BlogPost, slug=slug)
    return render(request, 'blog/post_detail.html', {'post': post})