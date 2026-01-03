import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AccountDeletionEmailRequest {
  email: string;
  fullName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName }: AccountDeletionEmailRequest = await req.json();

    const displayName = fullName || email.split('@')[0];

    const emailResponse = await resend.emails.send({
      from: "PalmCosmic <likermeow@gmail.com>",
      to: [email],
      subject: "Account Deletion Confirmation - PalmCosmic",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
          <div style="background: rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 30px; backdrop-filter: blur(10px);">
            <h1 style="margin: 0 0 20px 0; font-size: 28px; text-align: center;">
              🌟 PalmCosmic
            </h1>
            
            <h2 style="margin: 0 0 20px 0; font-size: 24px; text-align: center;">
              Account Deletion Confirmation
            </h2>
            
            <p style="font-size: 18px; line-height: 1.6; margin: 20px 0;">
              Hello ${displayName},
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; margin: 20px 0;">
              This email confirms that your PalmCosmic account has been successfully deleted. All your personal data, palm scan records, and account information have been permanently removed from our systems.
            </p>
            
            <div style="background: rgba(255, 255, 255, 0.2); padding: 20px; border-radius: 10px; margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; font-size: 18px;">What was deleted:</h3>
              <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Your profile information</li>
                <li>All palm scan records and analysis results</li>
                <li>Account credentials and authentication data</li>
                <li>Any uploaded profile pictures</li>
              </ul>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; margin: 20px 0;">
              If you decide to use PalmCosmic again in the future, you'll need to create a new account from scratch.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; margin: 20px 0;">
              Thank you for using PalmCosmic. We're sorry to see you go and hope you had a positive experience with our palm reading service.
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.3);">
              <p style="font-size: 14px; margin: 0; opacity: 0.8;">
                This is an automated confirmation email. Please do not reply to this message.
              </p>
              <p style="font-size: 14px; margin: 10px 0 0 0; opacity: 0.8;">
                © 2024 PalmCosmic - Cosmic Palm Reading Experience
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log("Account deletion email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-account-deletion-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);