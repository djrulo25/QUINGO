import mongoose, { Schema, Document } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IAddress {
  _id?: string
  label: string
  firstName: string
  lastName: string
  phone: string
  street: string
  number: string
  complement?: string
  city: string
  state: string
  zipCode: string
  country: string
  isDefault: boolean
  createdAt?: Date
}

export interface ICustomer extends Document {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  profileImage?: string
  addresses: IAddress[]
  dateOfBirth?: Date
  cpf?: string
  company?: string
  createdAt: Date
  updatedAt: Date
  comparePassword: (password: string) => Promise<boolean>
}

const addressSchema = new Schema<IAddress>({
  label: {
    type: String,
    required: true,
    enum: ['home', 'work', 'other'],
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  street: {
    type: String,
    required: true,
  },
  number: {
    type: String,
    required: true,
  },
  complement: String,
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
    default: 'Mexico',
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const customerSchema = new Schema<ICustomer>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    profileImage: String,
    addresses: [addressSchema],
    dateOfBirth: Date,
    cpf: {
      type: String,
      unique: true,
      sparse: true,
    },
    company: String,
  },
  { timestamps: true }
)

// Hash password before saving
customerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error: any) {
    next(error)
  }
})

// Method to compare passwords
customerSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return await bcrypt.compare(password, this.password)
}

const Customer = mongoose.model<ICustomer>('Customer', customerSchema)
export default Customer
