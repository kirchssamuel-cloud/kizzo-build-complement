import bcrypt from 'bcryptjs';
import {
  Matiere,
  NiveauScolaire,
  PrismaClient,
  RoleUtilisateur,
  StatutDefi,
  TypeQuestion,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ── Compte admin par défaut ─────────────────────────────────────────────
  const adminEmail = 'admin@appstronaute.com';
  const existingAdmin = await prisma.utilisateur.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const motDePasse = await bcrypt.hash('AdminKizzo2025!', 12);
    await prisma.utilisateur.create({
      data: {
        email: adminEmail,
        motDePasse,
        role: RoleUtilisateur.administrateur,
        emailVerifie: true,
        prenom: 'Admin',
        nom: 'Kizzo',
        profilAdmin: { create: {} },
      },
    });
    console.log('✓ Compte admin créé :', adminEmail);
  }

  // ── Compte parent de démo ───────────────────────────────────────────────
  const parentEmail = 'parent@demo.kizzo';
  const existingParent = await prisma.utilisateur.findUnique({ where: { email: parentEmail } });
  if (!existingParent) {
    const motDePasse = await bcrypt.hash('Demo1234!', 12);
    await prisma.utilisateur.create({
      data: {
        email: parentEmail,
        motDePasse,
        role: RoleUtilisateur.parent,
        emailVerifie: true,
        prenom: 'Léa',
        nom: 'Moreau',
      },
    });
    console.log('✓ Compte parent démo créé :', parentEmail);
  }

  // ── Défi de démo ────────────────────────────────────────────────────────
  const defisCount = await prisma.defi.count();
  if (defisCount === 0) {
    await prisma.defi.create({
      data: {
        titre: 'Les fractions simples',
        description: "Apprends à reconnaître et comparer des fractions de base.",
        matiere: Matiere.maths,
        niveauxScolaires: [NiveauScolaire.cm1, NiveauScolaire.cm2],
        difficulte: 2,
        nombreQuestions: 3,
        seuilReussite: 70,
        tempsRecompense: 15,
        statut: StatutDefi.publie,
        questions: {
          create: [
            {
              ordre: 1,
              enonce: 'Combien fait 1/2 + 1/2 ?',
              type: TypeQuestion.qcm,
              options: ['1/4', '1', '2', '1/2'],
              reponse: '1',
              explication: '1/2 + 1/2 = 2/2 = 1 entier.',
            },
            {
              ordre: 2,
              enonce: 'Quelle fraction est la plus grande : 1/3 ou 1/4 ?',
              type: TypeQuestion.qcm,
              options: ['1/3', '1/4', 'Elles sont égales'],
              reponse: '1/3',
              explication: "Plus le dénominateur est petit, plus la part est grande.",
            },
            {
              ordre: 3,
              enonce: 'Combien font 3/4 de 8 ?',
              type: TypeQuestion.calcul,
              reponse: '6',
              explication: '3/4 × 8 = 24/4 = 6.',
            },
          ],
        },
      },
    });
    console.log('✓ Défi de démo créé');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
