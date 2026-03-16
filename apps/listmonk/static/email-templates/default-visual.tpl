<!DOCTYPE html>
<html>
   <body>
      <div style="background-color:#eef4fb;color:#4b5f77;font-family:&quot;Avenir Next&quot;, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, sans-serif;font-size:16px;font-weight:400;letter-spacing:0.005em;line-height:1.5;margin:0;padding:24px 0;min-height:100%;width:100%">
         <table align="center" width="100%" style="margin:0 auto;max-width:620px;background-color:#FFFFFF;border:1px solid #d6e0ed;border-radius:18px;overflow:hidden" role="presentation" cellSpacing="0" cellPadding="0" border="0">
            <tbody>
               <tr style="width:100%">
                  <td>
                     <h3 style="font-weight:700;margin:0;font-size:22px;color:#101b2d;padding:24px 28px 12px 28px">Hello {{ .Subscriber.Name }}</h3>
                     <div style="font-weight:normal;padding:0 28px 18px 28px">
                        <p>This is a test e-mail campaign. Your second name is {{ .Subscriber.LastName }} and this block of text is in Markdown.</p>
                        <p>Here is a <a href="https://listmonk.app@TrackLink" target="_blank">tracked link</a>.</p>
                        <p>Use the link icon in the editor toolbar or when writing raw HTML or Markdown, simply suffix @TrackLink to the end of a URL to turn it into a tracking link. Example:</p>
                        <p><a href="https:/‌/listmonk.app@TrackLink"></a></p>
                        <p>For help, refer to the <a href="https://listmonk.app/docs" target="_blank">documentation</a>.</p>
                     </div>
                     <div style="padding:0 28px 28px 28px">
                        <a href="https://listmonk.app" style="color:#032017;font-size:16px;font-weight:700;background-color:#48e59b;border-radius:10px;display:inline-block;padding:12px 20px;text-decoration:none" target="_blank">
                           <span>
                              <!--[if mso]><i style="letter-spacing: 20px;mso-font-width:-100%;mso-text-raise:30" hidden>&nbsp;</i><![endif]-->
                           </span>
                           <span>This is a button</span>
                           <span>
                              <!--[if mso]><i style="letter-spacing: 20px;mso-font-width:-100%" hidden>&nbsp;</i><![endif]-->
                           </span>
                        </a>
                     </div>
                  </td>
               </tr>
            </tbody>
         </table>
      </div>
   </body>
</html>
