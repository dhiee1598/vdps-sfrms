import db from '~~/server/db';
import { feeTypes } from '~~/server/db/schema/fee-type-schema';
import { sundries } from '~~/server/db/schema/sundry-schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async () => {
  const allSundries = await db
    .select({
      id: sundries.id,
      name: sundries.name,
      description: sundries.description,
      amount: sundries.amount,
      typeId: sundries.typeId, // 👈 include typeId
      createdAt: sundries.createdAt,
      feeTypeName: feeTypes.name, // 👈 clearer naming
    })
    .from(sundries)
    .leftJoin(feeTypes, eq(sundries.typeId, feeTypes.id));

  return allSundries;
});
