CREATE TYPE "public"."carrinho_status" AS ENUM('ABERTO', 'FINALIZADO');--> statement-breakpoint
CREATE TABLE "carrinhos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "carrinho_status" DEFAULT 'ABERTO' NOT NULL,
	"cupom_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codigo_cupom" text NOT NULL,
	"percentual_desconto" numeric(5, 2) NOT NULL,
	CONSTRAINT "cupons_codigo_cupom_unique" UNIQUE("codigo_cupom")
);
--> statement-breakpoint
CREATE TABLE "itens_carrinho" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"carrinho_id" uuid NOT NULL,
	"produto_id" uuid NOT NULL,
	"quantidade" integer NOT NULL,
	CONSTRAINT "itens_carrinho_carrinho_produto_unique" UNIQUE("carrinho_id","produto_id")
);
--> statement-breakpoint
CREATE TABLE "produtos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"descricao_produto" text NOT NULL,
	"quantidade_estoque" integer NOT NULL,
	"preco_liquido" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "carrinhos" ADD CONSTRAINT "carrinhos_cupom_id_cupons_id_fk" FOREIGN KEY ("cupom_id") REFERENCES "public"."cupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itens_carrinho" ADD CONSTRAINT "itens_carrinho_carrinho_id_carrinhos_id_fk" FOREIGN KEY ("carrinho_id") REFERENCES "public"."carrinhos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itens_carrinho" ADD CONSTRAINT "itens_carrinho_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE no action ON UPDATE no action;