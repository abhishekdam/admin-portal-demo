import { Schema, model, Document } from 'mongoose';

export interface ProductDoc extends Document {
  sku: string;
  name: string;
  category: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isDeleted: boolean;
  deletedAt?: Date | null;
}

const ProductSchema = new Schema<ProductDoc>(
  {
    sku: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, required: true, min: 0, default: 5 },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Product = model<ProductDoc>('Product', ProductSchema);
