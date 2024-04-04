exports.handler = async (event, context) => {
   // Agrega tu console.log aquí
   console.log("Esta es la función registrandoUsuario");

   // Tu lógica aquí
   return {
       statusCode: 200,
       body: JSON.stringify({ message: "Funcionando" }),
   };
};