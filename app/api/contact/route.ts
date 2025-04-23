import { NextResponse } from "next/server";
import { Resend } from "resend";

// Inicializar o Resend com a sua API key
// Você precisará se registrar em https://resend.com
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, message } = body;

    // Validação básica no servidor
    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    // Enviar o email
    const data = await resend.emails.send({
      from: "Formulário de Contacto <noreply@seudominio.com>",
      to: "sergiosdcorreia@gmail.com",
      subject: `Nova mensagem de contacto de ${firstName} ${lastName}`,
      html: `
        <h2>Nova mensagem de contacto</h2>
        <p><strong>Nome:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Erro ao processar o contacto:", error);
    return NextResponse.json(
      { error: "Erro ao processar a sua solicitação" },
      { status: 500 }
    );
  }
}
