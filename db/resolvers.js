const Usuario = require("../models/Usuario");
const Producto = require("../models/Producto");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: "variables.env" });

const crearToken = (usuario, secreta, expiresIn) => {
  //console.log(usuario);
  const { id, email, nombre, apellido } = usuario;
  return jwt.sign({ id, email, nombre, apellido }, secreta, { expiresIn });
};

//Resolvers

const resolvers = {
  Query: {
    obtenerUsuario: async (_, { token }) => {
      const usuarioId = await jwt.verify(token, process.env.SECRETA);

      return usuarioId;
    },
  },

  Mutation: {
    nuevoUsuario: async (_, { input }) => {
      const { email, password } = input;
      console.log(input);

      //revisar si el usuario esta registrado
      const existeUsuario = await Usuario.findOne({ email });
      if (existeUsuario) {
        throw new Error("El usuario ya esta registrado");
      }

      //Hashear password
      const salt = await bcryptjs.genSalt(10);
      input.password = await bcryptjs.hash(password, salt);

      //Guardar en BD
      try {
        const usuario = new Usuario(input);
        usuario.save();
        return usuario;
      } catch (error) {
        console.log(error);
      }
    },
    autenticarUsuario: async (_, { input }) => {
      const { email, password } = input;

      // si el usuario existe

      const existeUsuario = await Usuario.findOne({ email });
      if (!existeUsuario) {
        throw new Error("El usuario no existe");
      }

      //Revisar si el pasword es correcto

      const passwordCorrecto = await bcryptjs.compare(
        password,
        existeUsuario.password
      );

      if (!passwordCorrecto) {
        throw new Error("El password es incorrecto");
      }

      //Crear token

      return {
        token: crearToken(existeUsuario, process.env.SECRETA, "24h"),
      };
    },
    nuevoProducto: async (_, { input }) => {
      try {
        const producto = new Producto(input);

        //Almacenar en BD

        const resultado = await producto.save();
        return resultado;
      } catch (error) {
        console.log(error);
      }
    },
  },
};

module.exports = resolvers;
