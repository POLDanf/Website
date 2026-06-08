from django.shortcuts import render
from blog.models import BlogPost
import json
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.core.mail import send_mail
from django.conf import settings

def home(request):
    blogs = BlogPost.objects.all()[:8]   # show up to 8 posts in the ticker
    return render(request, 'home/home.html', {'blogs': blogs})


@require_POST
def contact_submit(request):
    try:
        data = json.loads(request.body)
        
        name = data.get('name')
        email = data.get('email')
        subject = data.get('subject')
        message = data.get('message')

        # 1. Format a clean email structure
        email_subject = f"Website Contact Form: {subject}"
        email_body = f"""
        You have received a new message from your website contact form.

        Sender Details:
        Name: {name}
        Email: {email}

        Message:
        ------------------------------------------------------------
        {message}
        ------------------------------------------------------------
        """

        # 2. Use core mail to send it out
        send_mail(
            subject=email_subject,
            message=email_body,
            from_email=settings.EMAIL_HOST_USER,         # The sender address (your server)
            recipient_list=[settings.EMAIL_HOST_USER],   # Destined for your inbox
            fail_silently=False,                         # Throws a clear error if connection fails
        )

        return JsonResponse({'success': True})

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)