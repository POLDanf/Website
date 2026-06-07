from django.db import models


class BlogPost(models.Model):
    title       = models.CharField(max_length=200)
    slug        = models.SlugField(unique=True)
    excerpt     = models.CharField(max_length=300, blank=True)
    content     = models.TextField(blank=True)
    cover_image = models.URLField(blank=True, default='')
    category    = models.CharField(max_length=100, blank=True)
    published   = models.DateTimeField(auto_now_add=True)
    updated     = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-published']

    def __str__(self):
        return self.title
