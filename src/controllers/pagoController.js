import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const crearSesionPago = async (req, res) => {
    // 1. Extraemos el ID del huerto que viene desde el cliente (Postman/Frontend)
    const { huertoId } = req.body;

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Plan Pro - Agreenbyte 🌿',
                            description: 'Monitoreo avanzado de sensores y estadísticas',
                        },
                        unit_amount: 1000, // $10.00 USD
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            metadata: {
                huertoId: huertoId, 
                adminEmail: req.usuario?.email || 'usuario-desconocido' 
            },
            success_url: `${process.env.FRONTEND_URL}/pago-exitoso`,
            cancel_url: `${process.env.FRONTEND_URL}/pago-cancelado`,
        });

        res.json({ 
            id: session.id,
            url: session.url 
        });
    } catch (error) {
        // Manejo de errores detallado
        console.error("Error en Stripe:", error.message);
        res.status(500).json({ 
            msg: 'Hubo un error al generar la pasarela de pagos',
            error: error.message 
        });
    }
};

export { crearSesionPago };